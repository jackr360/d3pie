/**
 * Contains all the logic for the actual generator.
 */
define([
	"constants",
	"mediator",
	"titleTab",
	"sizeTab",
	"dataTab",
	"colorsTab",
	"labelsTab",
	"footerTab",
	"effectsTab",
	"eventsTab",
	"miscTab",
	"examplePies",
	"hbs!examplePiesTemplate",
	"hbs!generatorPageTemplate"
], function(C, mediator, titleTab, sizeTab, dataTab, colorsTab, labelsTab, footerTab, effectsTab, eventsTab, miscTab,
			EXAMPLE_PIES, examplePiesTemplate, generatorPageTemplate) {
	"use strict";

	var _MODULE_ID = "generatorPage";
	var _isCreated = false;
	var _demoD3Pie = null;

	/**
	 * Our initialization function. Called on page load.
	 * @private
	 */
	var _init = function() {

		_addTabEventHandlers();

		$("#generator").html(generatorPageTemplate({
			examples: examplePiesTemplate({ examples: EXAMPLE_PIES })
		}));

		// now fade in the three sections: nav, main content & footer row
		$("#generatorTabs,#mainContent,#footerRow").hide().removeClass("hidden").fadeIn(400);

		$("#exampleDropdown").on("click", "ul li a", function(e) {
			var index = parseInt($(e.target).data("index"), 10);
			_loadDemoPie(EXAMPLE_PIES[index]);
		});

		// always initialize the sidebar with whatever's in the selected example (always first item right now)
		_loadDemoPie(EXAMPLE_PIES[0]);

		// focus on the title field, just to be nice
		$("#pieTitle").focus();

		var subscriptions = {};
		subscriptions[C.EVENT.DEMO_PIE.RENDER.NO_ANIMATION]   = _renderWithNoAnimation;
		subscriptions[C.EVENT.DEMO_PIE.RENDER.WITH_ANIMATION] = _renderWithAnimation;
		subscriptions[C.EVENT.DEMO_PIE.RENDER.UPDATE_PROP]    = _updateProperty;
		subscriptions[C.EVENT.DEMO_PIE.SELECT_SEGMENT]        = _selectPieSegment;
		subscriptions[C.EVENT.PAGE.LOAD]                      = _onPageSelected;

		mediator.subscribe(_MODULE_ID, subscriptions);
	};

	/**
	 * Our main event handler assignment function. Bit klutzy - it would be nice to update this for some sort of
	 * binding, but it's simple & will do for now.
	 * @private
	 */
	var _addTabEventHandlers = function() {

		// add our sub tab event handler (here?)


		// general event handlers used in any old tab
		$(document).on("change", ".changeUpdateNoAnimation", _renderWithNoAnimation);
		$(document).on("keyup change", ".keyupUpdateNoAnimation", _onKeyupUpdateNoAnimation);
	};

	var _onKeyupUpdateNoAnimation = function(e) {
		var val = e.target.value;
		var isNumberField = $(e.target).hasClass("numbers");

		// check it's not empty and contains only numbers
		if (isNumberField) {
			if (/[^\d]/.test(val) || val === "") {
				$(e.target).addClass("hasError");
				return;
			}
		}

		$(e.target).removeClass("hasError");
		_renderWithNoAnimation();
	};

	var _renderWithNoAnimation = function() {
		_renderPie(false, _getConfigObject());
	};

	var _renderWithAnimation = function() {
		_renderPie(true, _getConfigObject());
	};

	var _updateProperty = function(msg) {
		//_demoD3Pie.updateProp(msg.data.prop, msg.data.value);
		$("#generatorPieChart").data("d3pie").updateProp(msg.data.prop, msg.data.value);
	};

	var _renderPie = function(includeStartAnimation, config) {

		// notify anyone that's interested that the data changed and we're going to do a re-render
		mediator.publish(_MODULE_ID, C.EVENT.DEMO_PIE.DATA_CHANGE, {
			includeStartAnimation: includeStartAnimation,
			config: config
		});

		// if we don't want to include the start animation, just override the values in the UI. This is useful for
		// automatically showing the user's latest changes to the pie settings and not having to see the animation
		// each and every time
		if (!includeStartAnimation) {
			config.effects.load.effect = "none";
		}

		if (_isCreated) {
			$("#generatorPieChart").data("d3pie").destroy();
		}

		_demoD3Pie = $("#generatorPieChart").d3pie(config);
		$("#generatorPieChartPad,#generatorPieChart").css({ width: config.size.canvasWidth, height: config.size.canvasHeight });
	};


	/**
	 * Parses the generator fields and get the latest values.
	 * @private
	 */
	var _getConfigObject = function() {
		return {
			header:    titleTab.getTabData(),
			footer:    footerTab.getTabData(),
			size:      sizeTab.getTabData(),
			data:      dataTab.getTabData(),
			labels:    labelsTab.getTabData(),
			styles:    colorsTab.getTabData(),
			effects:   effectsTab.getTabData(),
			callbacks: eventsTab.getTabData(),
			misc:      miscTab.getTabData()
		};
	};


	var _loadDemoPie = function(pieConfiguration) {
		var config = pieConfiguration.config;

		mediator.publish(_MODULE_ID, C.EVENT.DEMO_PIE.EXAMPLE_CHANGE, { config: config });

		// render the generator tabs
		titleTab.render("#generatorTitle", config);
		sizeTab.render("#generatorSize", config);
		dataTab.render("#generatorData", config);
		colorsTab.render("#generatorColors", config);
		labelsTab.render("#generatorLabels", config);
		footerTab.render("#generatorFooter", config);
		effectsTab.render("#generatorEffects", config);
		eventsTab.render("#generatorEvents", config);
		miscTab.render("#generatorMisc", config);

		// render the pie!
		_renderWithAnimation();
	};

	var _selectPieSegment = function() {
		var openSegmentInfo = $("#generatorPieChart").data("d3pie").getOpenPieSegment();
		if (openSegmentInfo === null) {
			$("#generatorPieChart").data("d3pie").openSegment(0);
		} else {
			var nextIndex = openSegmentInfo.index + 1;

			// assumption here is that the dataset in the generator is an accurate reflection of what's in the
			// demo pie. It's reasonable. Or I screwed up somewhere.
			var data = dataTab.getTabData();
			if (nextIndex > data.length-1) {
				nextIndex -= data.length;
			}
			$("#generatorPieChart").data("d3pie").openSegment(nextIndex);
		}
	};

	var _onPageSelected = function(msg) {
		if (msg.data.page !== "generator") {
			return;
		}

		// if we just switched to the generator tab, render the pie chart. If it's on page load (i.e. oldPage isn't
		// defined), we do it with animation
		if (!_isCreated) {
			_renderWithAnimation();
			_isCreated = true;
		} else if (msg.data.oldPage !== "generator") {
			_renderWithNoAnimation();
		}

		
	};

	mediator.register(_MODULE_ID);

	return {
		init: _init
	}
});