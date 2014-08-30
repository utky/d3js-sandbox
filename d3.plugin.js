/**
 */
(function(window, d3){

	/** ==============================================================
	 * Default functions
	 * # this could be overriden by user
	 */

	/* rendering DOM -------------------------------------------------*/
	function renderGroup(g) {
		g.classed("group", true)
			.append("text")
			.text(function(d) { return d.name || "Unnamed Group"; });
		g.append("path");
	}

	function renderNode(g) {
		var n = g.append("g").classed("node", true);
		n.append("rect")
			.attr("width", function(d) { return (d.width = 80); })
			.attr("height", function(d) { return (d.height = 50); })
			.attr("rx", function(d) { return 5; })
			.attr("ry", function(d) { return 5; });
		n.append("text")
			.text(function(d) { return d.name || "Unnamed Node"; });
	}
	
	function renderPort(g) {
		g.classed("port", true)
			.append("circle")
				.attr("r", function(d) { return 5; });
	}

	function renderLink(g) {
		g.classed("link", function(d) { return !d.__isBus; });
		g.append("line");
	}

	/* Tick action and modify DOM -------------------------------------------------*/
	function tickGroup(selection) {
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
				var vertices = subnodes.map(function(d) {
					var margin = 20;
					return [
						[ d.x - margin, d.y - margin]
						, [ d.x + margin, d.y - margin]
						, [ d.x - margin, d.y + margin]
						, [ d.x + margin, d.y + margin]
					];
				}).reduce(function(a, x) { return a.concat(x); }, new Array());
				var locationTo = (2 < vertices.length) ? d3.geom.hull(vertices) : [[0,0]];
				return "M" + locationTo.join("L") + "Z";
			});
	}

	function tickNode(selection) {
		return selection.attr("transform", function(d) {
			return "translate(" 
				+ ((d.x || 1) - (80 / 2)) + ","
				+ ((d.y || 1) - (50 / 2)) + ")";
		});
	}

	function tickLink(selection) {
		return selection.selectAll("line")
			.attr("x1", function(d) { return d.source.x; })
	    	.attr("y1", function(d) { return d.source.y; })
	    	.attr("x2", function(d) { return d.target.x; })
	    	.attr("y2", function(d) { return d.target.y; });
	}

	function tickPort(selection) {
		return selection.attr("transform", function(d) {
			return "translate(" 
				+ (d.x || 1) + ","
				+ (d.y || 1) + ")";
		});
	}

	function flattenGroups(data, config) {
		// flatten hierarchical group object to plain array.
		// by recursive reducing
		var folder = function(acc, g) {
			var gs = config.group.children(g);
			acc.push(g);
			return gs.reduce(folder, acc);
		};
		return folder(new Array(), data);
	}

	function selectNodeObjects(groups, config) {
		// collect node objects which underlies on a group object
		return groups.reduce(function(a, g) {
			return a.concat((config.group.nodes(g) || []));
		}, new Array());
	}

	function setParent(p, cs) {
		return cs.map(function(c) {
			c.parent = p;
			return c;
		});
	}

	function markAsNode(n) {
		n.__is_node__ = true;
		return n;
	}

	function isNode(n) {
		return n.__is_node__;
	}

	function indexOf(key, array, config, type) {
		for (var i = 0; i < array.length; i++) {
			var e = array[i];
			var _key = config[type].key(e);
			if (key == _key) return i;
		}
		return -1;
	}

	function indexedLink(links, ports, config) {
		return links.map(function(l) {
			var skey = config.link.portKey(l.source);
			var tkey = config.link.portKey(l.target);
			l.source = indexOf(skey, ports, config, "port");
			l.target = indexOf(tkey, ports, config, "port");
			return l;
		});
	}

	function internalBus(nodes, ports, config) {
		return ports.map(function(p, i) {
			// create internal bus link
			var nodeid = config.node.key(p.parent);
			var idx = indexOf(nodeid, nodes, config, "node");
			return {
				name: "internal-bus-node" + nodeid + "-port" + config.port.key(p)
				, source: idx
				, target: i
				, __isBus: true
				, linkStrength: 0.8
			};
		});
	}

	function processGroup(selection, config, data) {
		var groups = selection.selectAll(config.group.selector())
			.data(data, config.group.key);
		groups.enter().append("g")
			.call(config.group.render);
		return groups;
	}

	function processNode(selection, config) {
		var nodes = selection.selectAll(config.node.selector())
			.data(config.group.nodes, config.node.key);
		nodes.enter().append("g")
			.call(config.node.render);
		return nodes;
	}

	function processPort(selection, config) {
		var ports = selection.selectAll(config.port.selector())
			.data(config.node.ports, config.port.key);
		ports.enter().append("g")
			.call(config.port.render);
		return ports;
	}

	function processLink(selection, config, data) {
		var links = selection.selectAll(config.link.selector())
			.data(data);
		links.enter().append("g")
			.call(config.link.render);
		return links;
	}

	function fireTick(type, base, config) {
		var selection = base.selectAll(config[type].selector());
		return config[type].tick(selection);
	}

	/**
	 * Entry point of this plugin
	 */
	function create(options) {

		// Default configuration object
		var cfg = {
			width: function() { return 1200 }
			, height: function() { return 700 }
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
				, portKey: function(d) { return d; }
				, render: renderLink
				, tick: tickLink
			}
		};

		// selection processing
		function topology(selection) {
			selection.each(function(d, i) {

				var fireOrder = ["group", "node", "port", "link"];
				var force = cfg.force();

				// Build data to apply layout function (exclude root of group hierarchy)
				var groupsArray = flattenGroups(d.network, cfg).slice(1);
			
				var target = d3.select(this);

				/*
				 * Start transformation data to DOM
				 */
				var gs = processGroup(target, cfg, groupsArray);
				var ns = processNode(gs, cfg);
				var ps = processPort(ns, cfg);
				var ls = processLink(target, cfg, d.links);

				/*
				 * Setup force layout configuration
				 */
				var w = cfg.width();
				var h = cfg.height();
				var nodeBefore = selectNodeObjects(groupsArray, cfg);
				var nl = nodeBefore.length;
				var nodesArray = nodeBefore.map(function(n, i) {
					// initial coordinates
					n.x = (w / nl) * i;
					n.y = h / 2;
					n.fixed = cfg.node.fixed();
					return n;
				});
				var portsArray = nodesArray.reduce(function(acc, n) {
					markAsNode(n);
					var ports = (n.ports || []);
					return acc.concat(setParent(n, ports));
				}, new Array());
	
				var portLinks = indexedLink(d.links, portsArray, cfg).map(function(l) {
					l.source = l.source + nl;
					l.target = l.target + nl;
					console.log("indexed Link");
					console.log(l);
					return l;
				});
				var busLinks = internalBus(nodesArray, portsArray, cfg).map(function(l) {
					l.target = l.target + nl;
					console.log("ibus Link");
					console.log(l);
					return l;
				});

				var forceNodes = nodesArray.concat(portsArray);
				var forceLinks = portLinks.concat(busLinks);

				target.selectAll(cfg.node.selector()).call(force.drag);
				target.selectAll(cfg.port.selector()).call(force.drag);
				force.gravity(0)
    				//.size([cfg.width(), cfg.height()])
					.linkDistance(10)
					.linkStrength(function(link) {
						return (link.__isBus) ? 1 : 0.1 ;
					})
					//.charge(500)
					.nodes(forceNodes)
					.links(forceLinks)
					.on("tick", function() {
						fireOrder.map(function(t) {
							fireTick(t, target, cfg);
						});
					});
				force.start();
			});
		}

		topology.route = function(selection) {
			selection.each(function(d, i) {
				var routes = d.routes;
			});
		};

		return topology
	}

	d3.topology = create;

})(window, d3);


