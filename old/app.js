/**
 * Namespace
 */
(function(exports){
	function ofro() {
	}
	exports.ofro = ofro;
})(this);

/**
 * Utilities and Infrastructure
 */
(function(exports, _, $, undefined){
	exports.id = function(value) {
		return function() {
			return value;
		};
	};

	exports.get = function(options) {
		if (typeof options === "undefined") {
			var dummy = new $.Deferred;
			var promise = dummy.promise();
			dummy.reject("no parameter specified");
			return promise;
		}
		else if (typeof options === "string") {
			return $.getJSON(options)
		}
		else {
			return $.ajax(options)
		}
	};
	
})(ofro, _, jQuery);

/**
 * Generic Data Types
 */
(function(exports, ko, _, undefined){

	function Pos(x, y) {
		this.x = x;
		this.y = y;
	}

	function Vertex(value, pos) {
		this.value = value;
		this.pos = pos;
	}

	function Edge(src, dst) {
		this.src = src;
		this.dst = dst;
	}

	function Stage(vertexes, edges) {
		this.vertexes = vertexes;
		this.edges = edges;
	}

	function Tree(value, children) {
		this.value = value;
		this.children = children;
	}

	function Stream(source) {
		this.buffer = ko.observableArray(new Array());
		this.context = {};

		if (typeof source === "string" && source.indexOf("http") == 0) {
			this.context.type = "http";
			this.context.url = source;
		}
		else if (typeof source === "string" && source.indexOf("ws") == 0) {
			this.context.type = "ws";
			this.context.url = source;
		}
	}
	Stream.prototype = {
		constructor: Stream
		, map: function(f) {
			return new Stream(function(e) {
				return f(e);
			})
		}
		, flatMap: null
		, fold: null
		, filter: null
	};

	exports.Pos = Pos;
	exports.Vertex = Vertex;
	exports.Edge = Edge;
	exports.Stage = Stage;
	exports.Tree = Tree;

})(ofro, ko, _);

/**
 * Domain Specific ViewModel
 */
(function(exports, ko, _, ofro, undefined){

	function Network(data) {
		this.id = ofro.id(data.id);
		this.name = ko.observable(data.name);
		this.nodes = ko.observableArray(data.nodes);
		this.children = ko.observableArray(data.children);
	}

	function Node(data) {
		this.dpid = ofro.id(data.dpid);
		this.name = ko.observable(data.name);
		this.address = ko.observable(data.address);
		this.ports = ko.observableArray(data.ports);
	}

	function Port(data) {
		this.id = ofro.id(data.id);
		this.name = ko.observable(data.name);
	}

	exports.Network = Network;
	exports.Node = Node;
	exports.Port = Port;

})(ofro, ko, _, ofro);
