/*global Meteor, Template */

(function () {
	"use strict";

	Template.shoppingList.userLoggedIn = function () {
		return !!Meteor.userId();
	};
})();