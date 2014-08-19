/**
 * Knockout.js extension
 */
(function(d3, ko, undefined){

	var d3layout = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			console.debug(element);
			console.debug(valueAccessor);
			console.debug(allBindings);
			console.debug(viewModel);
			console.debug(bindingContext);
			var layout = allBindings.get("layout");
		}
		, update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var selector = allBindings.get("selector");
			var each = allBindings.get("each");
			var dataset = ko.unwrap(valueAccessor());
			var enter = d3.select(element).selectAll(selector).data(dataset).enter()
			each.call(enter);
		}
	};


	ko.bindingHandlers.enter = enter;

})(d3, ko);

