import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import { RowNode } from '../entities/rowNode';
import type { RowPinnedType } from '../interfaces/iRowNode';
export declare class PinnedRowModel extends BeanStub implements NamedBean {
    beanName: "pinnedRowModel";
    private beans;
    wireBeans(beans: BeanCollection): void;
    private nextId;
    private pinnedTopRows;
    private pinnedBottomRows;
    postConstruct(): void;
    isEmpty(floating: RowPinnedType): boolean;
    isRowsToRender(floating: RowPinnedType): boolean;
    getRowAtPixel(pixel: number, floating: RowPinnedType): number;
    private onGridStylesChanges;
    ensureRowHeightsValid(): boolean;
    private setPinnedTopRowData;
    private setPinnedBottomRowData;
    private createNodesFromData;
    getPinnedTopRowNodes(): RowNode[];
    getPinnedBottomRowNodes(): RowNode[];
    getPinnedTopTotalHeight(): number;
    getPinnedTopRowCount(): number;
    getPinnedBottomRowCount(): number;
    getPinnedTopRow(index: number): RowNode | undefined;
    getPinnedBottomRow(index: number): RowNode | undefined;
    forEachPinnedTopRow(callback: (rowNode: RowNode, index: number) => void): void;
    forEachPinnedBottomRow(callback: (rowNode: RowNode, index: number) => void): void;
    getPinnedBottomTotalHeight(): number;
    private getTotalHeight;
}
