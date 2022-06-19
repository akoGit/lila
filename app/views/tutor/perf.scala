package views.html.tutor

import controllers.routes
import play.api.libs.json._

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.String.html.safeJsonValue
import lila.tutor.{ TutorMetric, TutorMetricOption, TutorPerfReport, TutorRatio, TutorReport }

object perf {

  def apply(fullReport: TutorReport, report: TutorPerfReport, user: lila.user.User)(implicit ctx: Context) =
    views.html.base.layout(
      moreCss = frag(cssTag("tutor")),
      title = s"Lichess Tutor: ${report.perf.trans}"
    ) {
      main(cls := "page-menu tutor")(
        st.aside(cls := "page-menu__menu subnav")(
          a(href := routes.Tutor.user(user.username))("Tutor"),
          fullReport.perfs.map { p =>
            a(
              cls  := p.perf.key.active(report.perf.key),
              href := routes.Tutor.perf(user.username, p.perf.key)
            )(p.perf.trans)
          }
        ),
        div(cls := "page-menu__content box box-pad")(
          h1(
            a(href := routes.Tutor.user(user.username), dataIcon := "", cls := "text"),
            report.perf.trans
          ),
          div(cls := "tutor__perf")(
            p(a(href := routes.Tutor.openings(user.username, report.perf.key))("My openings")),
            p(a(href := routes.Tutor.phases(user.username, report.perf.key))("My game phases"))
          )
        )
      )
    }
}