define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dojo/_base/lang",

], function (declare, _WidgetBase, lang) {
    "use strict";

    return declare("CssClassSwitcher.widget.CssClassSwitcherContext", [ _WidgetBase ], {

        // modeler params
        inputTypeSelector: "",
        classGetterAttribute: "",
        elementSelector: "",
        classesToRemove: "",
        
        // internals
        _contextObject: null,
        _elementsToApplyTo: null,

        postCreate: function () {
          console.debug(this.id + ".postCreate - Selected '" + this.inputTypeSelector + "' for CSS class retrieval");
          this.domNode.style.display = "none";
          this._elementsToApplyTo = this.elementSelector
            ? Array.prototype.slice.call(document.querySelectorAll(this.elementSelector)) // NodeList to Array, cross-browser safe
            : [this.domNode.parentNode];
        },
        
        update: function (obj, callback) {  
          if(obj)
          {
            this._contextObject = obj;
            this.subscribe({
              guid: obj.getGuid(),
              callback: function(guid) {
                  this._updateRendering();
              }
            });
          }
          this._updateRendering();
          callback();
        },

        _updateRendering: function () {
          if(this._contextObject === null) {
            console.warn(this.id + " - No object received for call");
            return;
          }

          if(this.inputTypeSelector === 'attribute' && this.classGetterAttribute) {
            let selectedTheme = this._contextObject.get(this.classGetterAttribute);
            this._replaceClasses(selectedTheme);
          } else if (this.inputTypeSelector === 'microflow' && this.classGetterMicroflow) {
            mx.data.action({
              params: {
                actionname: this.classGetterMicroflow, 
                applyto: "selection",
                guids: [this._contextObject.getGuid()]
              },
              callback: lang.hitch(this, function (returnedString) {
                this._replaceClasses(returnedString);
              }),
              error: lang.hitch(this, function(error) {
                logger.error(this.id + " - Error in microflow " + this.classGetterMicroflow);
                logger.error(error);
              })
            });
          } else if (this.inputTypeSelector === 'nanoflow' && this.classGetterNanoflow) {
            var context = new mendix.lib.MxContext();
            context.setContext(this._contextObject.getEntity(), this._contextObject.getGuid());
            mx.data.callNanoflow({
              nanoflow: this.classGetterNanoflow,
              context: context,
              callback: lang.hitch(this, function (returnedString) {
                this._replaceClasses(returnedString);
              }),
              error: lang.hitch(this, function(error) {
                logger.error(this.id + " - Error in nanoflow " + this.classGetterNanoflow);
                logger.error(error);
              })
            });
          } else {
            logger.error(this.id + " - No valid data source was selected to retrieve CSS classes for theme switching")
          }
        },

        _replaceClasses: function (classesToAdd) {
          console.debug(this.id + " - Replacing classes with " + classesToAdd);
          var _this = this;
          // split by space
          var _toRemove = this.classesToRemove.split(" ");
          var _toAdd = classesToAdd.split(" ").filter(function(n) { return n; });;
          
          // Swap around so on switch we can pull old classes out
          this.classesToRemove = classesToAdd;

          // don't remove what should be added
          _toRemove = _toRemove.filter(function(n) { return _toAdd.indexOf(n) === -1; });
          this._elementsToApplyTo.forEach(function (_element) {
            _toRemove.forEach(function (_class) {
              if (_element.classList.contains(_class)) {
                _element.classList.remove(_class);
              }
            });
            _toAdd.forEach(function (_class) {
              if (!_element.classList.contains(_class)) {
                _element.classList.add(_class);
              }
            });
          });
        }
    });
});

require(["CssClassSwitcher/widget/CssClassSwitcherContext"]);