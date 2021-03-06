/** @flow */
import createIntervalTree from './intervalTree'


type RenderCallback = (index: number, left: number, top: number) => void;

// Position cache requirements:
//   O(log(n)) lookup of cells to render for a given viewport size
//   O(1) lookup of shortest measured column (so we know when to enter phase 1)
export default class PositionCache {
  //tallestColumnSize = 0
  //shortestColumnSize = 0
  count = 0
  // Tracks the height of each column
  _columnSizeMap: { [x: number]: number } = {}
  // Store tops and bottoms of each cell for fast intersection lookup.
  _intervalTree = createIntervalTree()
  // Maps cell index to x coordinates for quick lookup.
  _leftMap: { [index: number]: number } = {}

  estimateTotalHeight (
    cellCount: number,
    columnCount: number,
    defaultCellHeight: number,
  ): number {
    return (
      this.getTallestColumnSize()
      + Math.ceil((
        cellCount - this.count
      ) / columnCount)
      * defaultCellHeight
    )
  }

  // Render all cells visible within the viewport range defined.
  range (
    scrollTop: number,
    clientHeight: number,
    renderCallback: RenderCallback,
  ): void {
    this._intervalTree.queryInterval(
      scrollTop,
      scrollTop + clientHeight,
      ([top, _, index]) => renderCallback(index, this._leftMap[index], top),
    )
  }

  setPosition (index: number, left: number, top: number, height: number): void {
    this._intervalTree.insert([top, top + height, index])
    this._leftMap[index] = left

    const columnSizeMap = this._columnSizeMap
    const columnHeight = columnSizeMap[left]

    if (columnHeight === undefined) {
      height = top + height
      columnSizeMap[left] = height
    }
    else {
      height = Math.max(columnHeight, top + height)
      columnSizeMap[left] = height
    }

    this.count = this._intervalTree.count
  }

  getShortestColumnSize (): number {
    let keys = Object.keys(this._columnSizeMap),
        size = this._columnSizeMap[keys[0]],
        i = 1

    if (size !== void 0 && keys.length > 1) {
      for (; i < keys.length; i++) {
        let height = this._columnSizeMap[keys[i]]
        size = size < height ? size : height
      }
    }

    return size || 0
  }

  getTallestColumnSize (): number {
    return Math.max(0, Math.max.apply(null, Object.values(this._columnSizeMap)))
  }
}
