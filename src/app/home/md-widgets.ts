import { AnyVirtualDOM } from '@youwol/rx-vdom'
import { Router } from '@youwol/mkdocs-ts'
import {
    ProjectsDonutChart,
    LaunchPadView,
    ComponentsDonutChart,
} from './widgets'

export function launchPad(elem: HTMLElement): AnyVirtualDOM {
    return LaunchPadView.fromHTMLElement(elem)
}

export function projectsDonutChart(
    elem: HTMLElement,
    { router }: { router: Router },
): AnyVirtualDOM {
    return ProjectsDonutChart.fromHTMLElement(elem, router)
}

export function componentsDonutChart(
    elem: HTMLElement,
    { router }: { router: Router },
): AnyVirtualDOM {
    return ComponentsDonutChart.fromHTMLElement(elem, router)
}