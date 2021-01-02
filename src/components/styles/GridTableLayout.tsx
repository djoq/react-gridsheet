import styled from "styled-components";

export const GridTableLayout = styled.div`
  table {
    table-layout: fixed;
    border-collapse: collapse;
  }
  th {
    z-index: 2;
    font-size: 13px;
    font-weight: normal;
    box-sizing: border-box;
    &.sticky {
      position: sticky;
      position: -webkit-sticky;
    }
    &.horizontal {
      top: -1px;
      min-height: 20px;
      .resizer {
        resize: horizontal;
      }
    }
    &.vertical {
      left: -1px;
      overflow: hidden;
      min-width: 30px;
      .resizer {
        padding: 0 10px;
        resize: vertical; 
      }
    }
    .resizer {
      box-sizing: border-box;
      display: table-cell;
      vertical-align: middle;
      overflow: hidden;
    }
  }
  td {
    padding: 0;
    margin: 0;
    position: relative;
    &.copying {
      textarea:focus {
        outline: solid 1px #0077ff;
      }
    }
    .label {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 8px;
      background-color: rgba(0, 128, 255, 0.3);
      color: #ffffff;
      padding: 0 2px;
      display: none;
      opacity: 0.7;
      font-weight: normal;
    }
    .cell-wrapper-outer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      box-sizing: border-box;
      &.selected {
        background-color: rgba(0, 128, 255, 0.2);
        .label {
          display: block;
        }
      }
      &.pointed {
        border: solid 2px #0077ff;
        &.editing {
          overflow: visible;
          border: none;
        }
        .label {
          display: block;
        }
      }
    }
    .cell-wrapper-inner {
      display: table-cell;
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
