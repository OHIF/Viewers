(function($) {


    //Collapse the container
    function collapseContainer ( container ) {
        container.toggleClass("collapseHorizontal");
        var btnCollapse = container.find(".btnCollapse");
    }

    //function add collapse button
    function addButtonCollapse ( container ) {
        var btnCollapse = document.createElement("button");
        btnCollapse.innerHTML = ">";
        $(btnCollapse).addClass ("btnCollapse");

        btnCollapse.onclick = function() { // Note this is a function
            collapseContainer(container);
        };
        container.append(btnCollapse);
    }

    $.fn.dockingContainer = function(options) {
        var self = this;
        var opts = $.extend( {}, $.fn.dockingContainer.defaults, options);

        //Set container class
        this.addClass("dockingContainer");

        //Add btnCollapse
        addButtonCollapse(this);
        return this;
    };

    //Defaults
    $.fn.dockingContainer.defaults = {
      background: "black"
    };

}(jQuery));