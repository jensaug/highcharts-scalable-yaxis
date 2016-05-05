/**
 * Highcharts plugin for manually scaling Y-Axis range.
 *
 * Author: Roland Banguiran
 * Email: banguiran@gmail.com
 *
 * Usage: Set scalable:false in the yAxis options to disable.
 * Default: true
 */

// JSLint options:
/*global Highcharts, document, console */

(function (H) {
    'use strict';
    var addEvent = H.addEvent,
        each = H.each,
        doc = document,
        body = doc.body;

    H.wrap(H.Chart.prototype, 'init', function (proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        var chart = this,
            renderer = chart.renderer,
            yAxes = chart.yAxis,
            animation = yAxes.length <= 2 ? false : { duration: 500},
            offsetOpposite = 0,
            offsetAdjacent = 0,
            mousedownYAxis,
            previousYPixels,
            previousMin,
            previousMax,
            isUpperPortion;

        each(yAxes, function (yAxis, index) {
            var options = yAxis.options,
                scalable = options.scalable === undefined ? true : options.scalable,
                labels = options.labels,
                pointer = chart.pointer,
                labelGroupBBox,
                bBoxX,
                bBoxY,
                bBoxWidth,
                bBoxHeight,
                isDragging = false,
                downYValue;

            if (scalable) {
                bBoxWidth = 60;
                bBoxHeight = chart.containerHeight - yAxis.top - yAxis.bottom;
                bBoxX = yAxis.opposite ? (labels.align === 'left' ? chart.containerWidth - yAxis.right : chart.containerWidth - (yAxis.right + bBoxWidth)) : (labels.align === 'left' ? yAxis.left : yAxis.left - bBoxWidth);
                //Handle offset for multiple possible opposite yAxes
                if (yAxis.opposite) {
                    bBoxX += offsetOpposite;
                    offsetOpposite += bBoxWidth;
                } else {
                    bBoxX -= offsetAdjacent;
                    offsetAdjacent += bBoxWidth;
                }
                yAxis.jensIndex = index;

                bBoxY = yAxis.top;

                // Render an invisible bounding box around the y-axis label group
                // This is where we add mousedown event to start dragging
                labelGroupBBox = renderer.rect(bBoxX, bBoxY, bBoxWidth, bBoxHeight)
                    .attr({
                        fill: '#fff',
                        /*stroke: 'red',
                        'stroke-width': 1,*/
                        opacity: 0.0,
                        zIndex: 8
                    })
                    .css({
                        cursor: 'ns-resize'
                    })
                    .add();

                labels.style.cursor = 'ns-resize';

                addEvent(labelGroupBBox.element, 'mousedown', function (e) {
                    var downYPixels = pointer.normalize(e).chartY;

                    downYValue = yAxis.toValue(downYPixels);
                    isDragging = true;
                    mousedownYAxis = yAxis;
                    previousYPixels = downYPixels;
                    //previousMax = mousedownYAxis.toValue(downYPixels);
                    //previousMin = mousedownYAxis.getExtremes().dataMin;
                    //previousMax = mousedownYAxis.getExtremes().dataMax;
                    isUpperPortion = mousedownYAxis.toValue(downYPixels) > (mousedownYAxis.getExtremes().dataMin + mousedownYAxis.getExtremes().dataMax) / 2;
                    console.log('isUpperPortion: ' + isUpperPortion);
                });

                addEvent(chart.container, 'mousemove', function (e) {
                    if (isDragging) {
                        doc.body.style.cursor = 'ns-resize';

                        var dragYPixels = chart.pointer.normalize(e).chartY,
                            dragYValue = mousedownYAxis.toValue(dragYPixels),

                            extremes = mousedownYAxis.getExtremes(),
                            userMin = extremes.userMin,
                            userMax = extremes.userMax,
                            dataMin = extremes.dataMin,
                            dataMax = extremes.dataMax,

                            min = userMin !== undefined ? userMin : dataMin,
                            max = userMax !== undefined ? userMax : dataMax,

                            newMin,
                            newMax,

                            isDownward = (dragYPixels - previousYPixels > 0 ? true : false),
                            deltaValue = dragYValue - downYValue;

                        //console.log('isDownward: ' + isDownward);

                        if (deltaValue !== 0) {
                            if (isUpperPortion) {
                                // update max extreme only if dragged from upper portion
                                //newMax = max - (dragYValue - downYValue);
                                newMax = isDownward ? Math.max(previousMax || max, max - deltaValue) : Math.min(previousMax || max, max - deltaValue);
                                //console.log('deltadrag: ' + (dragYValue - downYValue));
                                //newMax = newMax > dataMax ? newMax : dataMax; //limit
                                newMin = min;
    //                            newMax = max - (dragYValue - downYValue);
    //                            newMax = newMax > dataMax ? newMax : dataMax; //limit
                            } else {
                                // update min extreme only if dragged from lower portion
                                newMin = isDownward ? Math.min(previousMin, min - deltaValue) : Math.max(previousMin, min - deltaValue);
                                //newMin = min - (dragYValue - downYValue);
                                //newMin = newMin < dataMin ? newMin : dataMin; //limit
                                newMax = max;
                            }
                            if (newMax !== previousMax || newMin !== previousMin) {
                                console.log('deltaValue: ' + deltaValue + ', newMin ' + newMin + ', newMax ' + newMax);
                                mousedownYAxis.setExtremes(newMin, newMax, true, animation);
                                //Remember these
                                previousYPixels = dragYPixels;
                                previousMin = newMin;
                                previousMax = newMax;
                            } else {
                                //console.log('Ignoring newMax ' + newMax + ' and newMin ' + newMin);
                            }
                        }
                    }
                });

                addEvent(document, 'mouseup', function () {
                    doc.body.style.cursor = 'default';
                    isDragging = false;
                    mousedownYAxis = null;
                });

                // double-click to go back to default range
                addEvent(labelGroupBBox.element, 'dblclick', function () {
                    var extremes = yAxis.getExtremes(),
                        dataMin = extremes.dataMin,
                        dataMax = extremes.dataMax;

                    yAxis.setExtremes(dataMin, dataMax, true, false);
                });
            }
        });
    });
}(Highcharts));
