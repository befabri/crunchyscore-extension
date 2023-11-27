import { ScoreType, insertScore } from "../../helpers/dom";
import { Anime, AnimeScore } from "../../models/model";
import { fetchAndSaveAnimeScores } from "../../services/apiService";
import { config } from "../../services/configService";
import { getStorageAnimeData, saveData } from "../../services/dataService";
import {
    getNotFoundCache,
    getTimestampFromLocalStorage,
    refreshNotFoundCache,
} from "../../services/notFoundCacheService";
import { extractIdFromUrl, findAnimeById, isDetailPage, isSimulcastPage, returnHref } from "../../utils/utils";

type SortableCard = {
    node: Element;
    score: number;
};

const REFRESH_DELAY_CACHE = 60 * 1000 * 2;
let pastURL = location.href;
let parentContainer: Element | null;
let parentClonedContainer: Element | null;

export async function handleCardPage() {
    if (isDetailPage(location.href)) {
        return;
    }
    const lastRefreshTime = getTimestampFromLocalStorage();
    if (Date.now() - lastRefreshTime >= REFRESH_DELAY_CACHE) {
        await refreshNotFoundCache();
    }
    let animesStorage = await getStorageAnimeData();
    const animeNotFound = await insertScoreController(animesStorage);
    if (!animeNotFound) {
        console.log("Nothing found return");
        return;
    }
    const notFoundCache = getNotFoundCache();
    const animes = animeNotFound.filter((anime) => !notFoundCache[anime.id]);
    if (animes.length > 0) {
        const animeFetch = await fetchAndSaveAnimeScores(animes);
        if (animeFetch) {
            await saveData(animeFetch.filter((anime) => anime.score !== 0));
            animesStorage = await getStorageAnimeData();
            await insertScoreController(animesStorage);
        }
    }
}

export async function insertScoreController(animes: AnimeScore[]): Promise<Anime[] | null> {
    if (isSimulcastPage(location.href) && pastURL !== location.href && parentContainer && parentClonedContainer) {
        const parentHref = returnHref(parentContainer.children);
        if (!parentHref || parentHref === returnHref(parentClonedContainer.children)) {
            location.reload();
            return null;
        }
        if (parentClonedContainer.childElementCount !== 0 && parentContainer.childElementCount !== 0) {
            parentClonedContainer.parentNode?.replaceChild(parentContainer, parentClonedContainer);
        }
    }

    const cards = Array.from(getCardsFromVideoPage());
    const notFound: Anime[] = cards.reduce<Anime[]>((acc, card) => {
        const cardElement = card as HTMLElement;
        const data = getDataFromCard(cardElement, animes);
        if (data) {
            insertScore(cardElement, data.score, ScoreType.CARD);
        } else {
            const notFoundAnime = getSearchFromCard(cardElement);
            if (notFoundAnime && notFoundAnime.id) {
                acc.push(notFoundAnime);
            }
        }
        return acc;
    }, []);
    if (!isSimulcastPage(location.href) || config.tab1.order === "order1") {
        pastURL = location.href;
        return notFound;
    }

    const sortChildren = (node: Element) => {
        const sorted = Array.from(node.children)
            .map((card: Element): SortableCard => {
                const scoreElement = card.querySelector(".score-card");
                return {
                    node: card,
                    score: scoreElement ? parseFloat(scoreElement.getAttribute("data-numberscore") || "0") : 0,
                };
            })
            .sort((a: SortableCard, b: SortableCard) =>
                config.tab1.order === "order2" ? a.score - b.score : b.score - a.score
            );

        sorted.forEach(({ node: childNode }) => node.appendChild(childNode));
    };
    parentContainer = document.querySelector(".erc-browse-cards-collection");
    parentClonedContainer = parentContainer ? (parentContainer.cloneNode(true) as Element) : null;
    const unwantedChildren = parentClonedContainer?.querySelectorAll(
        ".browse-card-placeholder--6UpIg.browse-card, .browse-card-placeholder--6UpIg.browse-card.hidden-mobile"
    );
    unwantedChildren?.forEach((child) => child.parentNode?.removeChild(child));
    if (parentClonedContainer) {
        sortChildren(parentClonedContainer);
        if (parentClonedContainer.childElementCount !== 0 && parentContainer) {
            parentContainer.parentNode?.replaceChild(parentClonedContainer, parentContainer);
        }
    }
    pastURL = location.href;
    return notFound;
}

export function getDataFromCard(card: HTMLElement, animes: AnimeScore[]): AnimeScore | undefined {
    const anime = getSearchFromCard(card);
    if (!anime) {
        return;
    }
    return findAnimeById(anime, animes);
}

export function getSearchFromCard(card: HTMLElement): Anime | undefined {
    const anchorElement = card.querySelector('a[tabindex="0"]');
    if (!anchorElement) {
        return;
    }
    const href = anchorElement.getAttribute("href");
    if (!href) {
        return;
    }
    const id = extractIdFromUrl(href);
    if (!id) {
        return;
    }
    return { id: id, seasonTags: null };
}

export function getCardsFromVideoPage() {
    return (
        document.querySelectorAll('[data-t="series-card "]') || document.querySelectorAll(".browse-card--esJdT")
    );
}
