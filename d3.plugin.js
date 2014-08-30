/**
 */
(function(window, d3){

	/** ==============================================================
	 * Default functions
	 * # this could be overriden by user
	 */

	/* rendering DOM -------------------------------------------------*/
	var renderGroup = function(g) {
		g.classed("group", true)
			.append("text")
			.text(function(d) { return d.name || "Unnamed Group"; });
		g.append("path");
	};

	var renderNode = function(g) {
		g.classed("node", true);
		g.append("rect")
			.attr("width", function(d) { return (d.width = 100); })
			.attr("height", function(d) { return (d.height = 50); })
			.attr("rx", function(d) { return 5; })
			.attr("ry", function(d) { return 5; });
		g.append("text")
			.text(function(d) { return d.name || "Unnamed Node"; });
	};
	
	var renderPort = function(g) {
		g.classed("port", true)
			.append("circle")
				.attr("r", function(d) { return 5; });
	};

	var renderLink = function(g) {
		g.classed("link", true);
		g.append("line");
	}

	/* Tick action and modify DOM -------------------------------------------------*/
	var tickGroup = function(selection) {
		var collectNode = function(acc, g) {
			var ns = acc.concat(g.nodes);
			var gs = g.children || [];
			return gs.reduce(collectNode, ns);
		};
		selection.selectAll("path")
			.attr("stroke-linecap", "round")
			.attr("stroke-linejoin", "round")
			.attr("d", function(d) {
				var subnodes = collectNode(new Array(), d);
				var vertices = subnodes.map(function(d) { return [ d.x, d.y ]; });
				var locationTo = (2 < vertices.length) ? d3.geom.hull(vertices) : (0 < vertices.length) ? vertices : [[0,0]];
				return "M" + locationTo.join("L") + "Z";
			});
	};

	var tickNode = function(selection) {
		selection.attr("transform", function(d) {
			return "translate(" 
				+ ((d.x || 1) - (100 / 2)) + ","
				+ ((d.y || 1) - (50 / 2)) + ")";
		});
	};
	var tickLink = function(selection) {
		selection.selectAll("line")
			.attr("x1", function(d) { return d.source.x; })
	    	.attr("y1", function(d) { return d.source.y; })
	    	.attr("x2", function(d) { return d.target.x; })
	    	.attr("y2", function(d) { return d.target.y; });
	};
	var tickPort = function(selection) {
	};


	/**
	 * Entry point of this plugin
	 */
	function create(options) {

		// Default configuration object
		var cfg = {
			width: function() { return 900 }
			, height: function() { return 800 }
			, force: function() {return d3.layout.force();}
			, group: {
				selector: function() { return ".group"; }
				, key : function(d) { return d.id }
				, children : function(d) { return d.children || []}
				, nodes : function(d) { return d.nodes || []}
				, render: renderGroup
				, tick: tickGroup
			}
			, node: {
				selector: function() { return ".node"; }
				, key : function(d) { return d.id }
				, ports : function(d) { return d.ports || []}
				, render: renderNode
				, tick: tickNode
				, fixed: function() { return true; }
			}
			, port: {
				selector: function() { return ".port"; }
				, key : function(d) { return d.id }
				, render: renderPort
				, tick: tickPort
			}
			, link: {
				selector: function() { return ".link"; }
				, render: renderLink
				, tick: tickLink
			}
		};

		// selection processing
		function topology(selection) {
			selection.each(function(d, i) {
				var force = cfg.force();

				// flatten hierarchical group object to plain array.
				// by recursive reducing
				var flattenGroup = function(acc, g) {
					var gs = cfg.group.children(g);
					acc.push(g);
					return gs.reduce(flattenGroup, acc);
				};
				var groupsArray = flattenGroup(new Array(), d.network);

				// collect node objects which underlies on a group object
				var nodesArray = groupsArray.reduce(function(a, g) {
					return a.concat((cfg.group.nodes(g) || []));
				}, new Array());
				var nl = nodesArray.length;

				// modify some fields for later rendering
				nodesArray = nodesArray.map(function(n, i) {
					// initial coordinates
					n.x = n.y = cfg.width() / nl * i;
					n.fixed = cfg.node.fixed();
					return n;
				});

				var target = d3.select(this);

				/*
				 * Start transformation data to DOM
				 */
				var groups = target.selectAll(cfg.group.selector())
					.data(groupsArray, cfg.group.key);
				groups.enter().append("g")
					.call(cfg.group.render);

				var nodes = groups.selectAll(cfg.node.selector())
					.data(cfg.group.nodes, cfg.node.key);
				nodes.enter().append("g")
					.call(cfg.node.render);

				var ports = nodes.selectAll(cfg.port.selector())
					.data(cfg.node.ports, cfg.port.key);
				ports.enter().append("g")
					.call(cfg.port.render);

				target.selectAll(cfg.link.selector())
					.data(d.links)
					.enter().append("g")
					.call(cfg.link.render);

				/*
				 * Setup force layout configuration
				 */
				target.selectAll(cfg.node.selector()).call(force.drag);
				force
					.gravity(0)
    				//.size([cfg.width(), cfg.height()])
					//.linkDistance(40)
					//.charge(-500)
					.nodes(nodesArray)
					.links(d.links)
					.on("tick", function() {

						var gs = target.selectAll(cfg.group.selector());
						var ns = target.selectAll(cfg.node.selector());
						var ps = target.selectAll(cfg.port.selector());
						var ls = target.selectAll(cfg.link.selector());

						cfg.group.tick(gs);
						cfg.node.tick(ns);
						cfg.port.tick(ps);
						cfg.link.tick(ls);
					});
				force.start();
			});
		}

		return topology
	}

	d3.topology = create

})(window, d3);


