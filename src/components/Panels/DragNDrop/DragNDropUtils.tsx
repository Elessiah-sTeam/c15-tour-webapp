import type {Active, Over} from "@dnd-kit/core";
import type {DndCat, DndItem} from "../../../dndTypes.ts";
import type {Dispatch, SetStateAction} from "react";
import {arrayMove} from "@dnd-kit/sortable";

export function getActiveItem(active: Active, categories: DndCat[]): DndItem | undefined {
    const catId: string = active.data.current?.categoryId;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId)?.items.find(i => i.id === active.id));
}

export function getActiveCat(active: Active, categories: DndCat[]): DndCat | undefined {
    const catId: string = active.id as string;
    if (!catId)
        return;
    return (categories.find(c => c.id === catId));
}

type CategorySetter = Dispatch<SetStateAction<DndCat[]>>;

export function reorderCategories(active: Active,
                                  over: Over,
                                  setCategories: CategorySetter): void
{
    setCategories((prev) => {
        const oldIndex: number = prev.findIndex((c) => c.id === active.id);
        const newIndex: number = prev.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1)
            return prev;
        return arrayMove(prev, oldIndex, newIndex);
    });
}

type OriginsNTarget = {
    category: {from: DndCat, to: DndCat},
    itemIndex: {old: number, new: number}
};

function getOriginsNTargets(categories: DndCat[],
                            srcCategory: string,
                            destCategory: string,
                            active: Active,
                            over: Over): OriginsNTarget | null {
    const from: DndCat | undefined = categories.find((c: DndCat): boolean => c.id === srcCategory);
    const to: DndCat | undefined = categories.find((c: DndCat): boolean => c.id === destCategory);

    if (!from || !to) {
        console.error("Failed to find the source or destination category !");
        return null;
    }

    const result: OriginsNTarget = {category: {from: from, to: to}, itemIndex: {old: -1, new: -1}};

    result.itemIndex.old = from.items.findIndex((i: DndItem): boolean => i.id === active.id);
    result.itemIndex.new = to.items.findIndex((i: DndItem): boolean => i.id === over.id);

    if (result.itemIndex.old == -1 || (result.itemIndex.new == -1 && to == from)) {
        // console.error("Failed to find the index item of origin");
        return null;
    } else if (result.itemIndex.new == -1) {
        result.itemIndex.new = 0;
    }

    return result;
}

// Si on est l'arrivée ou le départ on échange pour n'avoir qu'un élément
function switchStartEndItem(OGnT: OriginsNTarget): void {
    if (OGnT.category.to.isStartEnd && OGnT.category.to.items.length > 0) {
        const [item] = OGnT.category.to.items.splice(0, 1);
        OGnT.category.from.items.splice(OGnT.itemIndex.old, 0, item);
    } else if (OGnT.category.from.isStartEnd && OGnT.category.to.items.length > 0) {
        const [item] = OGnT.category.to.items.splice(OGnT.itemIndex.new, 1);
        OGnT.category.from.items.splice(0, 0, item);
    }
}

function moveItems(OGnT: OriginsNTarget): void {
    const [moved] = OGnT.category.from.items.splice(OGnT.itemIndex.old, 1);

    switchStartEndItem(OGnT);

    OGnT.category.to.items.splice(OGnT.itemIndex.new, 0, moved);
}

export function reorderItems(active: Active,
                             over: Over,
                             setCategories: CategorySetter): void
{
    const srcCategory: string | undefined = active.data.current?.categoryId;
    const destCategory: string | undefined = over.data.current?.categoryId ?? srcCategory;

    if (!srcCategory || !destCategory) {
        console.error("Missing source or destination category id");
        return;
    }

    setCategories((prev: DndCat[]): DndCat[] => {
        const newCats: DndCat[] = structuredClone(prev);

        let OGnT: OriginsNTarget | null;
        // Pour avoir une ligne plus courte
        // eslint-disable-next-line prefer-const
        OGnT = getOriginsNTargets(newCats, srcCategory, destCategory, active, over);
        if (OGnT)
            moveItems(OGnT);
        return newCats;
    });
}