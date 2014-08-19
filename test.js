/**
 * QuickCheck
 * うーん、dataで一括受信すると
 * networkとnode、portの関係を解析する必要がある
 *
 * 逆にそれをnetworkやnodeなどのメソッドで受け取ると
 * 階層関係の定義が別途必要になる
 */
(function(window, d3, $){

	window.d3test = {
		testDataFeed: function() {

			var topology = d3.topology().select("#graph-content");

			$.getJSON("./data/networks.json").success(function (data) {

				topology.data(data["root"], []);
				// topology.data(data["root"], data["links"]);

			}).error(function(e) {
				console.error(e);
			});
		}
		, testRender: function() {
		}
	};

	// execute test suite
	$(function() {
		for(var key in window.d3test) {
			var test = window.d3test[key];
			test.call(window);
		}
	});

})(window, d3, jQuery);


