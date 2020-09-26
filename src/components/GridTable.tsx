import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthsType,
  HeightsType,
} from "../types";
import { Y_START, Y_END, X_START, X_END, DUMMY_IMG } from "../constants";

import {
  Cell,
} from "./Cell";
import {
  convertNtoA,
  convertArrayToTSV,
  convertTSVToArray,
} from "../utils/converters";

interface Props {
  data: DataType;
  widths: WidthsType;
  heights: HeightsType;
  setWidths: (widths: WidthsType) => void;
  setHeights: (heights: HeightsType) => void;
};

type Position = [number, number];
type Range = [number, number, number, number];

const GridTableLayout = styled.div`
  .grid-table {
    table-layout: fixed;
    border-collapse: collapse;
    th, td {
      border: solid 1px #bbbbbb;
    }
    th {
      color: #777777;
      font-size: 13px;
      font-weight: normal;
      width: 80px;
      background-color: #eeeeee;

      &.col-number {
      }
      &.row-number {
      }

    }
    td {
      position: relative;
      padding: 0;
      margin: 0;
      width: 150px;
      background-color: #ffffff;
      border: solid 1px #cccccc;
      
      &.dragging {
        background-color: rgba(0, 128, 255, 0.2);
      }
      &.cutting {
        border: dotted 2px #0077ff;
        textarea:focus {
          outline: solid 1px #0077ff;
        }
      }
      &.copying {
        border: dashed 2px #0077ff;
        textarea:focus {
          outline: solid 1px #0077ff;
        }
      }
    }
  }
  .clipboard {
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    color: transparent;
    background-color: transparent;
    position: absolute;
    top: -999999px;
    left: -999999px;
    margin-left: -9999px;
    margin-top: -9999px;
    z-index: -9999;
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [rows, setRows] = React.useState(data);
  const [selecting, select] = React.useState<Position>([0, 0]);
  const [cutting, setCutting] = React.useState(false);

  const [dragging, drag] = React.useState<Range>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const draggingArea: Range = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [draggingArea[0], draggingArea[2]] = dragging[Y_START] < dragging[Y_END] ? [dragging[Y_START], dragging[Y_END]] : [dragging[Y_END], dragging[Y_START]];
  [draggingArea[1], draggingArea[3]] = dragging[X_START] < dragging[X_END] ? [dragging[X_START], dragging[X_END]] : [dragging[X_END], dragging[X_START]];

  const [copying, copy] = React.useState<Range>([-1, -1, -1, -1]); // (y-from, x-from) -> (y-to, x-to)
  const copyingArea: Range = [-1, -1, -1, -1]; // (top, left) -> (bottom, right)
  [copyingArea[0], copyingArea[2]] = copying[Y_START] < copying[Y_END] ? [copying[Y_START], copying[Y_END]] : [copying[Y_END], copying[Y_START]];
  [copyingArea[1], copyingArea[3]] = copying[X_START] < copying[X_END] ? [copying[X_START], copying[X_END]] : [copying[X_END], copying[X_START]];

  const isDragging = (y: number, x: number) => {
    const [top, left, bottom, right] = draggingArea;
    return top !== -1 && (top <= y && y <= bottom && left <= x && x <= right);
  };
  const isCopying = (y: number, x: number) => {
    const [top, left, bottom, right] = copyingArea;
    return (top <= y && y <= bottom && left <= x && x <= right);
  };

  const clipboardRef = React.createRef<HTMLTextAreaElement>();

  const handleProps = {
    rows, setRows,
    selecting, select,
    cutting, setCutting,
    heights, widths,
    drag, dragging, draggingArea,
    copy, copying, copyingArea, clipboardRef,
  };

  return (<GridTableLayout>
    <textarea className="clipboard" ref={clipboardRef}></textarea>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, x) => (<th 
            key={x}
            className="col-number"
            style={{ width }}
            onClick={(e) => {
              drag([0, x, heights.length - 1, x]);
              select([0, x]);
            }}
          >
          {convertNtoA(x + 1)}
          </th>))
          }
        </tr>
      </thead>
      <tbody>{heights.map((height, y) => (<tr key={y}>
        <th
          className="row-number" 
          style={{ height }}
          onClick={(e) => {
            drag([y, 0, y, widths.length - 1]);
            select([y, 0]);
            return false;
          }}
        >{y + 1}</th>
        {widths.map((width, x) => {
          const value = rows[y][x];
          return (<td
            key={x}
            className={`${isDragging(y, x) ? "dragging": ""} ${isCopying(y, x) ? cutting ? "cutting" : "copying" : ""}`}
            style={getCellStyle(y, x, copyingArea)}
            draggable
            onClick={(e) => {
              select([y, x]);
              drag([-1, -1, -1, -1]);
            }}
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              select([y, x]);
              drag([y, x, -1, -1]);
            }}
            onDragEnd={() => {
              if (dragging[0] === dragging[2] && dragging[1] === dragging[3]) {
                drag([-1, -1, -1, -1]);
              }
            }}
            onDragEnter={(e) => {
              drag([dragging[0], dragging[1], y, x])
            }}
          ><Cell
            value={value}
            x={x}
            y={y}
            write={handleWrite({... handleProps, y, x})}
            copy={handleCopy({... handleProps, y, x})}
            escape={handleEscape({... handleProps, y, x})}
            clear={handleClear({... handleProps, y, x})}
            paste={handlePaste({... handleProps, y, x})}
            drag={handleDrag({... handleProps, y, x})}
            dragAll={handleDragAll({... handleProps, y, x})}
            blur={handleBlur({... handleProps, y, x})}
            select={handleSelect({... handleProps, y, x})}
            selecting={selecting[0] === y && selecting[1] === x}
          /></td>);
        })}
      </tr>))
      }</tbody>
    </table>
  </GridTableLayout>);
};

type handlePropsType = {
  y: number;
  x: number;
  rows: DataType;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  dragging: Range;
  draggingArea: Range;
  copying: Range;
  copyingArea: Range;
  heights: string[];
  widths: string[];
  cutting: boolean,
  copy: (range: Range) => void;
  drag: (range: Range) => void;
  select: (position: Position) => void;
  setCutting: (cutting: boolean) => void;
  setRows: (rows: DataType) => void;
};

const handleBlur = ({
  drag,
  select,
}: handlePropsType) => {
  return () => {
    select([-1, -1]);
    drag([-1, -1, -1, -1]);
  };
};

const handleClear = ({
  x, y,
  rows, setRows,
  dragging,
  draggingArea,
}: handlePropsType) => {
  const [top, left, bottom, right] = draggingArea;
  return () => {
    if (dragging[0] === -1) {
      rows[y][x] = "";
    } else {
      for (let y = top; y <= bottom; y++) {
        for (let x = left; x <= right; x++) {
          rows[y][x] = "";
        }
      }
    }
    setRows([... rows]);
  };
};

const handleCopy = ({
  x, y,
  rows,
  clipboardRef,
  dragging,
  draggingArea,
  copyingArea,
  copy,
  select,
  setCutting,
}: handlePropsType) => {
  let [top, left, bottom, right] = copyingArea;
  if (top === -1) {
    [top, left, bottom, right] = draggingArea;
  }
  return (cutting=false) => {
    const input = clipboardRef.current;
    let tsv = "";
    if (top === -1) {
      copy([y, x, y, x]);
      tsv = rows[y][x];
    } else {
      copy([top, left, bottom, right]);
      const copyingArea = rows.slice(top, bottom + 1).map((cols) => cols.slice(left, right + 1));
      tsv = convertArrayToTSV(copyingArea)
    }
    if (input != null) {
      input.value = tsv;
      input.focus();
      input.select();
      document.execCommand("copy");
      input.value = "";
      input.blur();
      setTimeout(() => select([y, x]), 100); // refocus
    }
    setCutting(cutting);
  };
};

const handleDrag = ({
  x, y,
  drag, dragging,
  heights, widths,
}: handlePropsType) => {
  return (deltaY: number, deltaX: number) => {
    let [dragEndY, dragEndX] = [dragging[2] === -1 ? y : dragging[2], dragging[3] === -1 ? x : dragging[3]];
    let [nextY, nextX] = [dragEndY + deltaY, dragEndX + deltaX];
    if (nextY < 0 || heights.length <= nextY || nextX < 0 || widths.length <= nextX) {
      return;
    }
    y === nextY && x === nextX ? drag([-1, -1, -1, -1]) : drag([y, x, nextY, nextX]);
  };
}

const handleDragAll = ({
  drag, 
  heights, widths,
}: handlePropsType) => {
  return () => {
    drag([0, 0, heights.length - 1, widths.length - 1]);
  };
};

const handleEscape = ({
  copy,
  setCutting,
}: handlePropsType) => {
  return () => {
    copy([-1, -1, -1, -1]);
    setCutting(false);
  };
};

const handlePaste = ({
  x, y,
  rows,
  draggingArea, copyingArea,
  cutting,
  drag,
  copy,
  heights, widths,
  setRows,
}: handlePropsType) => {
  const [draggingTop, draggingLeft, draggingBottom, draggingRight] = draggingArea;
  const [copyingTop, copyingLeft, copyingBottom, copyingRight] = copyingArea;
  const [draggingHeight, draggingWidth] = [draggingBottom - draggingTop, draggingRight - draggingLeft];
  const [copyingHeight, copyingWidth] = [copyingBottom - copyingTop, copyingRight - copyingLeft];
  return (text: string) => {
    if (draggingTop === -1) {
      if (copyingTop === -1) {
        const newRows = convertTSVToArray(text);
        for (let _y = 0; _y < newRows.length; _y++) {
          for (let _x = 0; _x < newRows[_y].length; _x++) {
            rows[y + _y][x + _x] = newRows[_y][_x];
          }
        }
        drag([y, x, y + newRows.length - 1, x + newRows[0].length - 1]);
      } else {
        for (let _y = 0; _y <= copyingHeight; _y++) {
          for (let _x = 0; _x <= copyingWidth; _x++) {
            const [dstY, dstX, srcY, srcX] = [y + _y, x + _x, copyingTop + _y, copyingLeft + _x];
            if (dstY < heights.length && dstX < widths.length) {
              rows[dstY][dstX] = rows[srcY][srcX];
            }
          }
        }
        if (copyingHeight > 0 || copyingWidth > 0) {
          drag([y, x, y + copyingHeight, x + copyingWidth]);
        }
      }
    } else {
      if (copyingTop === -1) {
        const newRows = convertTSVToArray(text);
        for (let y = draggingTop; y <= draggingBottom; y++) {
          for (let x = draggingLeft; x <= draggingRight; x++) {
            rows[y][x] = newRows[y % newRows.length][x % newRows[0].length];
          }
        }
      } else {
        const [biggerHeight, biggerWidth] = [draggingHeight > copyingHeight ? draggingHeight : copyingHeight, draggingWidth > copyingWidth ? draggingWidth : copyingWidth]
        for (let _y = 0; _y <= biggerHeight; _y++) {
          for (let _x = 0; _x <= biggerWidth; _x++) {
            const [dstY, dstX, srcY, srcX] = [y + _y, x + _x, copyingTop + (_y % (copyingHeight + 1)), copyingLeft + (_x % (copyingWidth + 1))];
            if (dstY < heights.length && dstX < widths.length) {
              rows[dstY][dstX] = rows[srcY][srcX];
            }
          }
        }
        drag([y, x, y + biggerHeight, x + biggerWidth]);
      }
    }
    if (cutting) {
      for (let _y = 0; _y <= copyingHeight; _y++) {
        for (let _x = 0; _x <= copyingWidth; _x++) {
          const [srcY, srcX] = [copyingTop + _y, copyingLeft + _x];
          rows[srcY][srcX] = "";
        }
      }
    }
    setRows([...rows]);
    copy([-1, -1, -1, -1]);
  };
};

const handleSelect = ({
  draggingArea,
  drag,
  select,
  heights, widths,
}: handlePropsType) => {
  const [top, left, bottom, right] = draggingArea;
  return (nextY: number, nextX: number, breaking: boolean) => {
    if (nextY < top && top !== -1 && !breaking) {
      nextY = bottom;
      nextX = nextX > left ? nextX - 1 : right;
    }
    if (nextY > bottom && bottom !== -1 && !breaking) {
      nextY = top;
      nextX = nextX < right ? nextX + 1 : left;
    }
    if (nextX < left && left !== -1 && !breaking) {
      nextX = right;
      nextY = nextY > top ? nextY - 1 : bottom;
    }
    if (nextX > right && right !== -1 && !breaking) {
      nextX = left;
      nextY = nextY < bottom ? nextY + 1 : top;
    }
    if (breaking) {
      drag([-1, -1, -1, -1]);
    }
    if (nextY < 0 || heights.length <= nextY || nextX < 0 || widths.length <= nextX) {
      return;
    }
    select([nextY, nextX]);
  };
};

const handleWrite = ({
  y, x,
  rows, setRows,
  heights, widths,
}: handlePropsType) => {
  return (value: string) => {
    rows[y][x] = value;
    setRows([...rows]);
  };
};

const getCellStyle = (y: number, x: number, copyingArea: Range): React.CSSProperties => {
  let style: any = {};
  const [top, left, bottom, right] = copyingArea;

  if (top < y && y <= bottom) {
    style.borderTop = "solid 1px #dddddd";
  }
  if (top <= y && y < bottom) {
    style.borderBottom = "solid 1px #dddddd";
  }
  if (left < x && x <= right) {
    style.borderLeft = "solid 1px #dddddd";
  }
  if (left <= x && x < right) {
    style.borderRight = "solid 1px #dddddd";
  }
  return style;
};
