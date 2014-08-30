/**
 * QuickCheck
 * うーん、dataで一括受信すると
 * networkとnode、portの関係を解析する必要がある
 *
 * 逆にそれをnetworkやnodeなどのメソッドで受け取ると
 * 階層関係の定義が別途必要になる
 */
(function(window, d3){

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


	function create() {

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

		// entry point of selection processing
		function topology(selection) {
			selection.each(function(d, i) {
				var force = cfg.force();

				var foldGroup = function(acc, g) {
					var gs = cfg.group.children(g);
					acc.push(g);
					return gs.reduce(foldGroup, acc);
				};

				var groupsArray = foldGroup(new Array(), d.network);
				var nodesArray = groupsArray.reduce(function(a, g) {
					return a.concat((cfg.group.nodes(g) || []));
				}, new Array());
				var nl = nodesArray.length;
				nodesArray = nodesArray.map(function(n, i) {
					// initial coordinates
					n.x = n.y = cfg.width() / nl * i;
					n.fixed = cfg.node.fixed();
					return n;
				});

				var target = d3.select(this);

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

		/*
		topology.nodes = function(value) {
			if (!arguments.length) return nodes;
			nodes = value;
			return topology;
		}

		topology.links = function(value) {
			if (!arguments.length) return links;
			links = value;
			return topology;
		}
		*/

		topology.select = function(type, callback) {
			return function(selection) {
				if (callback) selection.selectAll(type).call(callback);
			};
		}

		return topology
	}

	d3.topology = create

 /*

	function Topology(baseSelection, options) {
		this.baseSelection = baseSelection;
		this.force = d3.layout.force()
	    	.size([this.baseSelection.attr("width"), this.baseSelection.attr("height")])
	    	.charge(-400)
	    	.linkDistance(40)
	    	.on("tick", this.tick(this));
	
		this.drag = this.force.drag()
	    	.on("dragstart", this.dragstart);
		this.groups = [];
	 
	}
	
	Topology.prototype = {
		constructor: Topology
		, node: function() { return this.baseSelection.selectAll(".node"); }
		, link: function() { return this.baseSelection.selectAll(".link"); }
		, data: function(nodes, links) {
			this.force
				.nodes(nodes)
				.links(links)
				.start();
	
			this.link().data(links)
	    		.enter().append("line")
	      			.attr("class", "link");
	 
			this.node().data(nodes, function(d) { return d.id })
	    		.enter().append("circle")
	      			.attr("class", "node")
	      			.attr("r", 12)
		  			.classed("fixed", function(d) {return d.fixed = true})
	      			.on("dblclick", this.dblclick)
	      			.call(this.drag);
	
			this.groups = d3.nest().key(function(d) { return d.parent.id; }).entries(nodes);
			console.log(this.groups);
	
			return this;
		}
		, tick: function(thisArg) {
			return function() {
				thisArg.link().attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
	 
				thisArg.node().attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; });
				
				thisArg.baseSelection.selectAll("path")
				    .data(thisArg.groups)
				      .attr("d", thisArg.groupPath)
				    .enter().insert("path", "circle")
						.style("fill", function(d) { return "cyan" })
						.style("stroke", function(d) { return "cyan" })
				      .style("stroke-width", 40)
				      .style("stroke-linejoin", "round")
				      .style("opacity", .2)
				      .attr("d", thisArg.groupPath);
	
			};
		}
		, dblclick: function (d) {
			  d3.select(this).classed("fixed", d.fixed = false);
			}
		, dragstart: function (d) {
	  		d3.select(this).classed("fixed", d.fixed = true);
		}
		, groupPath: function(d) {
			var vertices = d.values.map(function(i) { return [i.x, i.y]; });
			var toBeJoined = vertices.langth > 2 ? d3.geom.hull(vertices) : vertices;
		    return "M" + toBeJoined.join("L") + "Z";
		}
	};
	
	var topology = function(selection) {
		return new Topology(selection);
	};
	 
	var width = 960,
	    height = 500;
	 
	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height);
	 
	d3.json("networks.json", function(error, data) {
	
		var collectNode = function(network) {
			var nodes = network.nodes || [];
			nodes.map(function(n) { n.parent = network; });
			var subNodes = network.children.map(collectNode);
			return subNodes.reduce(function(a, ns) { return a.concat(ns); }, nodes.concat());
		};
	
		var nodes = collectNode(data.root);
	
		//var topology = new Topology(svg);
		var t = topology(svg);
		t.data(nodes, data.links);
		console.log(t.link().data());
	});


 
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
	*/

})(window, d3);


