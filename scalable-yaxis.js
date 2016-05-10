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
/*global Highcharts, document */

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
            //animation = yAxes.length <= 2 ? false : { duration: 250}, //Enables smoother but lagging redraws
            animation = false,
            synchYAxes = true,
            offsetOpposite = 0,
            offsetAdjacent = 0;           

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
                downYPixels,
                downYValue,
                isUpperPortion;

            if (scalable) {
                bBoxWidth = 60;
                bBoxHeight = chart.containerHeight - yAxis.top - yAxis.bottom;
                bBoxX = yAxis.opposite ? (labels.align === 'left' ? chart.containerWidth - yAxis.right : chart.containerWidth - (yAxis.right + bBoxWidth)) : (labels.align === 'left' ? yAxis.left : yAxis.left - bBoxWidth);
                //Handle offset for multiple yAxes
                if (yAxis.opposite) {
                	bBoxX += offsetOpposite;
                	offsetOpposite += bBoxWidth;
                } else {
                	bBoxX -= offsetAdjacent;
                	offsetAdjacent += bBoxWidth;                	
                }
                yAxis.index = index;
                
                bBoxY = yAxis.top;

                // Render an invisible bounding box around the y-axis label group
                // This is where we add mousedown event to start dragging
                labelGroupBBox = renderer.rect(bBoxX, bBoxY, bBoxWidth, bBoxHeight)
                    .attr({
                        fill: '#fff',
                        opacity: 0.0,
                        /*
                        fill: '#aaa',
                        stroke: 'red',
                        'stroke-width': 1,
                        opacity: 0.25,
                        */                        
                        zIndex: 8
                    })
                    .css({
                        cursor: 'ns-resize'
                    })
                    .add();

                labels.style.cursor = 'ns-resize';

                addEvent(labelGroupBBox.element, 'mousedown', function (e) {
                    isDragging = true;                	
                    downYPixels = pointer.normalize(e).chartY;
                    downYValue = yAxis.toValue(downYPixels);
                    isUpperPortion = yAxis.toValue(downYPixels) > (yAxis.getExtremes().dataMin + yAxis.getExtremes().dataMax) / 2;
                });

                addEvent(chart.container, 'mousemove', function (e) {
                	var selectedAxes = synchYAxes ? yAxes : [yAxis],
            			dragYPixels = chart.pointer.normalize(e).chartY,
                        dragYValue,
                        extremes,
                        userMin,
                        userMax,
                        dataMin,
                        dataMax,
                        min,
                        max,
                        newMin,
                        newMax,
                        index;
                	
                    if (isDragging) {
                    	doc.body.style.cursor = 'ns-resize';

                    	for (index in selectedAxes) {
                            dragYValue = selectedAxes[index].toValue(dragYPixels);
                            extremes = selectedAxes[index].getExtremes();
                            userMin = extremes.userMin;
                            userMax = extremes.userMax;
                            dataMin = extremes.dataMin;
                            dataMax = extremes.dataMax;

                            min = userMin !== undefined ? userMin : dataMin;
                            max = userMax !== undefined ? userMax : dataMax;
	                            
	                        if (isUpperPortion) {
	                            // update max extreme only if dragged from upper portion
	                        	newMax = max - (dragYValue - downYValue);                            	
	                        	//newMax = newMax > dataMax ? newMax : dataMax; //limit //disabled
	                            newMin = min;
	                        } else {
	                            // update min extreme only if dragged from lower portion
	                            newMin = min - (dragYValue - downYValue);
	                            //newMin = newMin < dataMin ? newMin : dataMin; //limit //disabled
	                            newMax = max;
	                        }                        
	                        selectedAxes[index].setExtremes(newMin, newMax, true, animation);
                    	}
                    }
                });

                addEvent(document, 'mouseup', function () {
                	doc.body.style.cursor = 'default';
                    isDragging = false;
                });

                // double-click to go back to default range
                addEvent(labelGroupBBox.element, 'dblclick', function () {
                	var selectedAxes = synchYAxes ? yAxes : [yAxis],
                			index;
                	
                	for (index in selectedAxes) {
                		selectedAxes[index].setExtremes(selectedAxes[index].getExtremes().dataMin, selectedAxes[index].getExtremes().dataMax, true, false);                		
                	}
                });
            }
        });
    });
}(Highcharts));
