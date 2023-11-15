// scrap

//let grid1 = new GridLayoutBox(parentWidth,parentHeight);
//grid1.setGridWithRatios([[1, 2, 1], [1, 4, 5], [6, 1]], parentWidth, parentHeight, { horizontal: 10, vertical: 15 }); // Creates a grid with specified ratios
// grid1.insetStarts = { "allEdgesPt": 10};
/*

USAGE

setGridWithRatios

This function will create a grid layout 
where the size of each cell is determined 
by the ratio in the passed 2D array.


let gridRow = new GridLayoutBox();
gridRow.setRowWithProportions([3, 1, 2], parentWidth, parentHeight, 10); // Creates a row with proportions 3:1:2

let grid = new GridLayoutBox();
grid.setGridWithRatios([[1, 2, 1], [3, 4, 5], [6, 1]], parentWidth, parentHeight, { horizontal: 10, vertical: 15 }); // Creates a grid with specified ratios

*/

/*

setGridWithRatios(ratios, parentWidth, parentHeight, gutterSize) {
    const totalWidthRatio = ratios[0].reduce((a, b) => a + b, 0);
    const totalHeightRatio = ratios.length;
    const cellWidth = (parentWidth - gutterSize.horizontal * (ratios[0].length - 1)) / totalWidthRatio;
    const cellHeight = (parentHeight - gutterSize.vertical * (ratios.length - 1)) / totalHeightRatio;

    let gridLayouts = [];
    let topPosition = 0;

    for (let row = 0; row < ratios.length; row++) {
        let leftPosition = 0;
        for (let column = 0; column < ratios[row].length; column++) {
            const width = cellWidth * ratios[row][column];
            const layout = new GridLayoutBox();
            layout.insetStarts = { "leftEdgePt": leftPosition, "topEdgePt": topPosition };
            layout.dimensionsByInsetting = { "fromLeftEdgePt": width, "fromTopEdgePt": cellHeight };

            leftPosition += width + gutterSize.horizontal;
            gridLayouts.push(layout);
        }
        topPosition += cellHeight + gutterSize.vertical;
    }

    this.children = gridLayouts;
}
*/