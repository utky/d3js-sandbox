(function(window, d3, undefined){

	var create = function(name) {
		var elmenet = window.document.createElement(name);
		return d3.select(element);
	}

	var renderNetwork = function(selection) {
		var g = selection.append("g")
			.attr("class", this.opts.network.classes)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.attr("r", function(d) { return d["_nodeCount"]; });
		g.append("circle").attr("r", function(d) {return d.r});
		g.append("text")
			.attr("class", "node-name")
			.attr("y", function (d) {return d.r * -1 - 10})
      		.style("fill-opacity", 1)
      		.text(this.opts.network.name);
	};

	var renderNode = function(selection) {
		var g = selection.append("g").attr("class", this.opts.node.classes);
		g.append("rect")
			.attr({
				"rx": 5,
				"ry": 5,
				"x": -15,
				"y": 0,
				"width": 30,
				"height": 30
			});
		g.append("text")
			.attr("class", "node-name")
			.attr("y", -5)
      		.style("fill-opacity", 1)
      		.text(this.opts.node.name);
	};

	var renderPort = function(selection) {
		var g = selection.append("g").attr("class", "port");
		g.append("circle")
			.attr("r", 3)
			.attr("title", function(d) { return d.name });
	};

	function Topology(options) {
		this.opts = options;
		this.selection = null;
		this.pack = d3.layout.pack();
		this.force = d3.layout.force()
			.size([800, 400])
			.linkDistance(20)
			.linkStrength(1)
			.charge(0);

		var baseSize = 10;
		
		var countNodes = function(d) {
			if (d["_nodeCount"]) {
				return d["_nodeCount"];
			}
			var count = d.nodes.length;
			var subCounts = d3.sum(d.children.map(countNodes));
			var underlyingNodeCount = count + subCounts;
			d["_nodeCount"] = underlyingNodeCount;
			return (count + subCounts) + baseSize;
		}

		this.pack
			.size([800, 400])
			.value(countNodes);
	}

	var topology = function(options) {
		// TODO: avoid using jQuery and impl own deep copy
		var opts = $.extend({}, topology.defaults, options);
		return new Topology(opts);
	};

	topology.defaults = {
		network: {
			classes: "network"
			, selector: function(container) { return container.selectAll("." + this.classes);}
			, renderer: renderNetwork
			, key: function(d) { return d["id"]; }
			, name: function(d) { return d["name"]; }
			, children: function(d) { return d["children"]; }
			, nodes: function(d) { return d["nodes"]; }
		}
		, node: {
			classes: "node"
			, selector: function(container) { return container.selectAll("." + this.classes);}
			, renderer: renderNode 
			, key: function(d) { return d["id"]; }
			, name: function(d) { return d["name"]; }
			, ports: function(d) { return d["ports"]; }
		}
		, port: {
			classes: "port"
			, selector: function(container) { return container.selectAll("." + this.classes);}
			, renderer: renderPort 
			, key: function(d) { return d["id"]; }
			, name: function(d) { return d["name"]; }
		}
	};

	var topologyFunctions = function() {

		this.select = function(selector) {
			this.selection = d3.select(selector);
			return this;
		};

		this.data = function(networks, links) {
			this.networks(networks);
			this.links(links);
			return this;
		};

		this._setParent = function(list, getChildren) {
			return list.map(function(p) {
				var children = getChildren(p) || [];
				// set a reference to the parent network on each node
				children.map(function(c) { c["parent"] = p });
				return children;
			}).reduce(function(a, children) {
				return a.concat(children);
			}, new Array());
		};

		this._selectAll = function(type, base) {
			var base = base || this.selection;
			var result = null;
			if ("network" === type) {
				result = this.opts.network.selector(base);	
			}
			else if ("node" === type) {
				return this.opts.node.selector(this._selectAll("network", base));
			}
			else if ("port" === type) {
				return this.opts.port.selector(this._selectAll("node", base));
			}
			else {
				result = new Array();
			}
			return result;
		};

		this.networks = function(data) {

			var networkSelection = this._selectAll("network", this.selection);

			// in case called as getter
			if (!data) {
				return networkSelection;
			}
			
			var _self = this;
			var targets = this.pack.children(this.opts.network.children).nodes(data);

			this.opts.network.renderer.call(
					this,
					networkSelection.data(
						targets,
						this.opts.network.key)
					.enter());

			var ns = this._setParent(targets, this.opts.network.nodes);

			this.nodes(ns);

			return this;
		};

		this.nodes = function (data) {

			var nodeSelection = this._selectAll("node", this.selection);


			if (!data) {
				return nodeSelection;
			}

			var _self = this;
			this.force.nodes(data);

			this.opts.node.renderer.call(this,
					nodeSelection.data(
						function (nw) { return _self.opts.network.nodes(nw) },
						this.opts.node.key)
					.enter());

			var ps = this._setParent(data, this.opts.node.ports);

			this.ports(ps);

			return this;
		};

		this.ports = function(data) {

			var portSelection = this._selectAll("port", this.selection);

			var targets = this.force.nodes(data);

			var _self = this;
			this.opts.port.renderer.call(this, portSelection.data(
						function (n) { return _self.opts.node.ports(n) },
						this.opts.port.key).enter());

			return this;
		};

		this.links = function (data) {
			this.force = this.force || d3.layout.force();

			var targets = this.force.links(data);
			return this;
		};
	};
	topologyFunctions.call(Topology.prototype);

	d3.topology = topology;
	
})(window, d3, jQuery, _);
