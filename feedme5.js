/*global Meteor, Session, Template, $ */

var perms = {
	insert: function(userId, doc) {
		return userId && doc.owner === userId;
	},
	update: function(userId, doc, fields, modifier) {
		return doc && doc.owner === userId;
	},
	remove: function(userId, doc) {
		return doc && doc.owner === userId;
	}
};
var deny = {
	update: function(userId, docs, fields, modifier) {
		return fields.indexOf('owner') > -1;
	}
};

List = new Meteor.Collection('list');
List.allow(perms);
List.deny(deny);
Stores = new Meteor.Collection('stores');
Stores.allow(perms);
Stores.deny(deny);

if (Meteor.isClient) {
	Meteor.subscribe("list");
	Meteor.subscribe("stores");
}

if (Meteor.isServer) {
	Meteor.publish("list", function() {
		return List.find({owner: this.userId});
	});
	Meteor.publish("stores", function() {
		return Stores.find({owner: this.userId});
	});
}