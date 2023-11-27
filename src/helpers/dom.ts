import { TabConfig, config } from "../services/configService";
import { roundScore } from "../utils/utils";

export enum ScoreType {
    CARD = "card",
    DETAIL = "detail",
}

export function insertScore(spanElement: HTMLElement, score: number, type: ScoreType) {
    if (type !== ScoreType.CARD && type !== ScoreType.DETAIL) {
        return;
    }
    const classSelector = type === ScoreType.CARD ? ".score-card" : ".score-hero";
    let tabConfig: TabConfig;
    switch (type) {
        case ScoreType.CARD:
            tabConfig = config.tab1;
            break;

        case ScoreType.DETAIL:
            tabConfig = config.tab2;
            break;
    }
    if (spanElement.querySelector(classSelector)) {
        return;
    }
    const scoreElement = createScoreElement(score, type, tabConfig);
    if (type === ScoreType.CARD) {
        insertToLayoutCard(scoreElement, spanElement, tabConfig.layout);
    } else if (type === ScoreType.DETAIL) {
        insertToLayoutHero(scoreElement, spanElement, tabConfig.layout);
    }
}

function createScoreElement(score: number, type: ScoreType, tabConfig: TabConfig): HTMLElement {
    const scoreElement = document.createElement("span");
    const scoreNumber = roundScore(score, tabConfig.decimal);
    scoreElement.textContent = ` ${tabConfig.text} ${scoreNumber}`;
    scoreElement.style.color = tabConfig.color;
    scoreElement.classList.add(type === ScoreType.CARD ? "score-card" : "score-hero");
    scoreElement.setAttribute("data-textscore", tabConfig.text);
    scoreElement.setAttribute("data-numberscore", scoreNumber.toString());
    return scoreElement;
}

function insertToLayoutCard(score: Node, targetElement: Element, layout: string): void {
    const h4Element = targetElement.querySelector("h4");
    switch (layout) {
        case "layout1":
            h4Element?.appendChild(score);
            break;
        case "layout2":
            h4Element?.parentNode?.insertBefore(score, h4Element.nextElementSibling);
            break;
        case "layout3":
            targetElement.querySelector('div[data-t="meta-tags"]')?.appendChild(score);
            break;
        case "layout4":
            targetElement.appendChild(score);
            break;
    }
}

function insertToLayoutHero(score: Node, targetElement: Element, layout: string): void {
    const h1Element = targetElement.querySelector("h1");
    const tag = document.querySelector("div.erc-series-tags.tags");
    switch (layout) {
        case "layout1":
            h1Element?.appendChild(score);
            break;
        case "layout2":
            h1Element?.parentNode?.insertBefore(score, h1Element.nextElementSibling);
            break;
        case "layout3":
            tag?.querySelector('div[data-t="meta-tags"]')?.appendChild(score);
            break;
    }
}

export { insertToLayoutCard, insertToLayoutHero, createScoreElement };