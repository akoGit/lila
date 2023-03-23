import * as cg from 'chessground/types';
import { promote } from './promotion';
import { propWithEffect } from 'common';
import { voiceCtrl } from './main';
import { RootCtrl, MoveHandler, MoveCtrl } from './interfaces';

export function makeMoveCtrl(root: RootCtrl, step: { fen: string }): MoveCtrl {
  const isFocused = propWithEffect(false, root.redraw);
  const modalOpen = propWithEffect(false, root.redraw);
  const handlers = new Set<MoveHandler>();
  let initFen = step.fen;
  let lastSelect = performance.now();
  const cgState = root.chessground.state;
  const usedSan = false;
  function select(key: cg.Key): void {
    if (cgState.selected === key) {
      root.chessground.cancelMove();
    } else {
      root.chessground.selectSquare(key, true);
      lastSelect = performance.now();
    }
  }
  return {
    drop(key, piece) {
      const role = pieceCharToRole[piece];
      const crazyData = root.data.crazyhouse;
      const color = root.data.player.color;
      // Crazyhouse not set up properly
      if (!root.crazyValid || !root.sendNewPiece) return;
      // Square occupied
      if (!role || !crazyData || cgState.pieces.has(key)) return;
      // Piece not in Pocket
      if (!crazyData.pockets[color === 'white' ? 0 : 1][role]) return;
      if (!root.crazyValid(role, key)) return;
      root.chessground.cancelMove();
      root.chessground.newPiece({ role, color }, key);
      root.sendNewPiece(role, key, false);
    },
    update(step, yourMove = false) {
      initFen = step.fen;
      handlers.forEach(h => h(step.fen, root.chessground, yourMove));
    },
    addHandler(h: MoveHandler) {
      handlers.add(h);
      h(initFen, root.chessground);
    },
    move(orig, dest, pieceChar) {
      const variant = root.data.game.variant.key;
      const role = pieceChar ? pieceCharToRole[pieceChar.toUpperCase()] : undefined;
      if (role === 'pawn' || (role === 'king' && variant !== 'antichess')) return;
      root.chessground.cancelMove();
      if (role) {
        promote(root.chessground, dest, role);
        root.sendMove(orig, dest, role, { premove: false });
      } else {
        //usedSan = true; // what is this?  something to do with AB but not sure what
        root.chessground.selectSquare(orig, true);
        root.chessground.selectSquare(dest, root.keyboard || role !== undefined);
      }
    },
    select,
    hasSelected: () => cgState.selected,
    confirmMove: () => (root.submitMove ? root.submitMove(true) : null),
    usedSan,
    jump(plyDelta: number) {
      root.userJumpPlyDelta && root.userJumpPlyDelta(plyDelta);
      root.redraw();
    },
    justSelected: () => performance.now() - lastSelect < 500,
    clock: () => root.clock,
    draw: () => (root.offerDraw ? root.offerDraw(true, true) : null),
    resign: (v, immediately) => (root.resign ? root.resign(v, immediately) : null),
    rematch: (accept?: boolean) => root.rematch?.(accept) ?? false,
    takeback: () => root.takebackYes?.(),
    next: () => root.next?.(),
    vote: (v: boolean) => root.vote?.(v),
    modalOpen,
    isFocused,
    voice: voiceCtrl,
    root,
    mode: root.next ? 'puzzle' : 'round',
    redraw: root.redraw,
  };
}

const pieceCharToRole: { [key: string]: cg.Role } = {
  P: 'pawn',
  N: 'knight',
  B: 'bishop',
  R: 'rook',
  Q: 'queen',
  K: 'king',
};