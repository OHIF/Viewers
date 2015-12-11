OHIF = window.OHIF || {};

Meteor.startup(function() {

    if (!OHIF.viewer) {
        OHIF.viewer = {};
    }

    OHIF.viewer.defaultHotkeys = {
        defaultTool: "ESC",
        angle: "A",
        stackScroll: "S",
        wwwcRegion: "R",
        pan: "P",
        magnify: "M",
        length: "L",
        scrollDown: "DOWN",
        scrollUp: "UP",
        nextPanel: "RIGHT",
        previousPanel: "LEFT",
        invert: "I",
        flipV: "V",
        flipH: "H",
        wwwc: "W",
        annotate: "T",
        cinePlay: "SPACE",
        rotateR: "F",
        rotateL: "G",
        toggleTools: 'TAB',
        toggleOverlayTags: 'SHIFT',
        WLPresetABD: ["NUMPAD1", "1"],
        WLPresetBone: ["NUMPAD2", "2"],
        WLPresetBrain: ["NUMPAD3", "3"],
        WLPresetLiver: ["NUMPAD4", "4"],
        WLPresetLung: ["NUMPAD5", "5"],
        WLPresetMediastinum: ["NUMPAD6", "6"],
        WLPresetMRSoftTissue: ["NUMPAD7", "7"],
        WLPresetMRSpine: ["NUMPAD8", "8"],
        WLPresetSubdural: ["NUMPAD9", "9"]
    };
    
    // For now
    OHIF.viewer.hotkeys = OHIF.viewer.defaultHotkeys;

    OHIF.viewer.defaultWLPresets = {
        'ABD' : {wc : 40, ww : 400},
        'Bone' : {wc: 450, ww : 1800},
        'Brain' : {wc : 36, ww : 90},
        'Liver' : {wc : 40, ww : 250},
        'Lung' : {wc : -400, ww : 1600},
        'Mediastinum' : {wc : 50, ww : 450},
        'MRSoftTissue' : {wc : 600, ww : 1200},
        'MRSpine' : {wc : 400, ww : 600},
        'Subdural' : {wc : 75, ww : 150}
    };

    // For now
    OHIF.viewer.wlPresets = OHIF.viewer.defaultWLPresets;

    OHIF.viewer.globals = {};
    OHIF.viewer.globals.keyboardMap = [
      "", // [0]
      "", // [1]
      "", // [2]
      "CANCEL", // [3]
      "", // [4]
      "", // [5]
      "HELP", // [6]
      "", // [7]
      "BACK_SPACE", // [8]
      "TAB", // [9]
      "", // [10]
      "", // [11]
      "CLEAR", // [12]
      "ENTER", // [13]
      "ENTER_SPECIAL", // [14]
      "", // [15]
      "SHIFT", // [16]
      "CONTROL", // [17]
      "ALT", // [18]
      "PAUSE", // [19]
      "CAPS_LOCK", // [20]
      "KANA", // [21]
      "EISU", // [22]
      "JUNJA", // [23]
      "FINAL", // [24]
      "HANJA", // [25]
      "", // [26]
      "ESCAPE", // [27]
      "CONVERT", // [28]
      "NONCONVERT", // [29]
      "ACCEPT", // [30]
      "MODECHANGE", // [31]
      "SPACE", // [32]
      "PAGE_UP", // [33]
      "PAGE_DOWN", // [34]
      "END", // [35]
      "HOME", // [36]
      "LEFT", // [37]
      "UP", // [38]
      "RIGHT", // [39]
      "DOWN", // [40]
      "SELECT", // [41]
      "PRINT", // [42]
      "EXECUTE", // [43]
      "PRINTSCREEN", // [44]
      "INSERT", // [45]
      "DELETE", // [46]
      "", // [47]
      "0", // [48]
      "1", // [49]
      "2", // [50]
      "3", // [51]
      "4", // [52]
      "5", // [53]
      "6", // [54]
      "7", // [55]
      "8", // [56]
      "9", // [57]
      "COLON", // [58]
      "SEMICOLON", // [59]
      "LESS_THAN", // [60]
      "EQUALS", // [61]
      "GREATER_THAN", // [62]
      "QUESTION_MARK", // [63]
      "AT", // [64]
      "A", // [65]
      "B", // [66]
      "C", // [67]
      "D", // [68]
      "E", // [69]
      "F", // [70]
      "G", // [71]
      "H", // [72]
      "I", // [73]
      "J", // [74]
      "K", // [75]
      "L", // [76]
      "M", // [77]
      "N", // [78]
      "O", // [79]
      "P", // [80]
      "Q", // [81]
      "R", // [82]
      "S", // [83]
      "T", // [84]
      "U", // [85]
      "V", // [86]
      "W", // [87]
      "X", // [88]
      "Y", // [89]
      "Z", // [90]
      "WIN", // [91]
      "", // [92]
      "CONTEXT_MENU", // [93]
      "", // [94]
      "SLEEP", // [95]
      "NUMPAD0", // [96]
      "NUMPAD1", // [97]
      "NUMPAD2", // [98]
      "NUMPAD3", // [99]
      "NUMPAD4", // [100]
      "NUMPAD5", // [101]
      "NUMPAD6", // [102]
      "NUMPAD7", // [103]
      "NUMPAD8", // [104]
      "NUMPAD9", // [105]
      "MULTIPLY", // [106]
      "ADD", // [107]
      "SEPARATOR", // [108]
      "SUBTRACT", // [109]
      "DECIMAL", // [110]
      "DIVIDE", // [111]
      "F1", // [112]
      "F2", // [113]
      "F3", // [114]
      "F4", // [115]
      "F5", // [116]
      "F6", // [117]
      "F7", // [118]
      "F8", // [119]
      "F9", // [120]
      "F10", // [121]
      "F11", // [122]
      "F12", // [123]
      "F13", // [124]
      "F14", // [125]
      "F15", // [126]
      "F16", // [127]
      "F17", // [128]
      "F18", // [129]
      "F19", // [130]
      "F20", // [131]
      "F21", // [132]
      "F22", // [133]
      "F23", // [134]
      "F24", // [135]
      "", // [136]
      "", // [137]
      "", // [138]
      "", // [139]
      "", // [140]
      "", // [141]
      "", // [142]
      "", // [143]
      "NUM_LOCK", // [144]
      "SCROLL_LOCK", // [145]
      "WIN_OEM_FJ_JISHO", // [146]
      "WIN_OEM_FJ_MASSHOU", // [147]
      "WIN_OEM_FJ_TOUROKU", // [148]
      "WIN_OEM_FJ_LOYA", // [149]
      "WIN_OEM_FJ_ROYA", // [150]
      "", // [151]
      "", // [152]
      "", // [153]
      "", // [154]
      "", // [155]
      "", // [156]
      "", // [157]
      "", // [158]
      "", // [159]
      "CIRCUMFLEX", // [160]
      "EXCLAMATION", // [161]
      "DOUBLE_QUOTE", // [162]
      "HASH", // [163]
      "DOLLAR", // [164]
      "PERCENT", // [165]
      "AMPERSAND", // [166]
      "UNDERSCORE", // [167]
      "OPEN_PAREN", // [168]
      "CLOSE_PAREN", // [169]
      "ASTERISK", // [170]
      "PLUS", // [171]
      "PIPE", // [172]
      "HYPHEN_MINUS", // [173]
      "OPEN_CURLY_BRACKET", // [174]
      "CLOSE_CURLY_BRACKET", // [175]
      "TILDE", // [176]
      "", // [177]
      "", // [178]
      "", // [179]
      "", // [180]
      "VOLUME_MUTE", // [181]
      "VOLUME_DOWN", // [182]
      "VOLUME_UP", // [183]
      "", // [184]
      "", // [185]
      "SEMICOLON", // [186]
      "EQUALS", // [187]
      "COMMA", // [188]
      "MINUS", // [189]
      "PERIOD", // [190]
      "SLASH", // [191]
      "BACK_QUOTE", // [192]
      "", // [193]
      "", // [194]
      "", // [195]
      "", // [196]
      "", // [197]
      "", // [198]
      "", // [199]
      "", // [200]
      "", // [201]
      "", // [202]
      "", // [203]
      "", // [204]
      "", // [205]
      "", // [206]
      "", // [207]
      "", // [208]
      "", // [209]
      "", // [210]
      "", // [211]
      "", // [212]
      "", // [213]
      "", // [214]
      "", // [215]
      "", // [216]
      "", // [217]
      "", // [218]
      "OPEN_BRACKET", // [219]
      "BACK_SLASH", // [220]
      "CLOSE_BRACKET", // [221]
      "QUOTE", // [222]
      "", // [223]
      "META", // [224]
      "ALTGR", // [225]
      "", // [226]
      "WIN_ICO_HELP", // [227]
      "WIN_ICO_00", // [228]
      "", // [229]
      "WIN_ICO_CLEAR", // [230]
      "", // [231]
      "", // [232]
      "WIN_OEM_RESET", // [233]
      "WIN_OEM_JUMP", // [234]
      "WIN_OEM_PA1", // [235]
      "WIN_OEM_PA2", // [236]
      "WIN_OEM_PA3", // [237]
      "WIN_OEM_WSCTRL", // [238]
      "WIN_OEM_CUSEL", // [239]
      "WIN_OEM_ATTN", // [240]
      "WIN_OEM_FINISH", // [241]
      "WIN_OEM_COPY", // [242]
      "WIN_OEM_AUTO", // [243]
      "WIN_OEM_ENLW", // [244]
      "WIN_OEM_BACKTAB", // [245]
      "ATTN", // [246]
      "CRSEL", // [247]
      "EXSEL", // [248]
      "EREOF", // [249]
      "PLAY", // [250]
      "ZOOM", // [251]
      "", // [252]
      "PA1", // [253]
      "WIN_OEM_CLEAR", // [254]
      "" // [255]
    ];

    OHIF.viewer.hotkeyFunctions = {
        wwwc: function() {
            toolManager.setActiveTool("wwwc");
        },
        angle: function() {
            toolManager.setActiveTool("angle");
        },
        dragProbe: function() {
            toolManager.setActiveTool("dragProbe");
        },
        ellipticalRoi: function() {
            toolManager.setActiveTool("ellipticalRoi");
        },
        magnify: function() {
            toolManager.setActiveTool("magnify");
        },
        annotate: function() {
            toolManager.setActiveTool("annotate");
        },
        stackScroll: function() {
            toolManager.setActiveTool("stackScroll");
        },
        pan: function() {
            toolManager.setActiveTool("pan");
        },
        length: function() {
            toolManager.setActiveTool("length");
        },
        spine: function() {
            toolManager.setActiveTool("spine");
        },
        wwwcRegion: function() {
            toolManager.setActiveTool("wwwcRegion");
        },
        zoomIn: function () {
            var button = document.getElementById("zoomIn");
            flashButton(button);
            zoomIn();
        },
        zoomOut: function () {
            var button = document.getElementById("zoomOut");
            flashButton(button);
            zoomOut();
        },
        zoomToFit: function () {
            var button = document.getElementById("zoomToFit");
            flashButton(button);
            zoomToFit();
        },
        scrollDown: function() {
            var container = $('.viewportContainer.active');
            var button = container.find('#nextImage').get(0);

            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                flashButton(button);
                switchToImageRelative(1);
            }
        },
        scrollFirstImage: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(0);
            }
        },
        scrollLastImage: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(-1);
            }
        },
        scrollUp: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                var button = container.find('#prevImage').get(0);
                flashButton(button);
                switchToImageRelative(-1);
            }
        },
        nextPanel: function() {
            nextActivePanel();
        },
        previousPanel: function() {
            previousActivePanel();
        },
        invert: function() {
            var button = document.getElementById("invert");
            flashButton(button);
            invert();
        },
        flipV: function() {
            var button = document.getElementById("flipV");
            flashButton(button);
            flipV();
        },
        flipH: function() {
            var button = document.getElementById("flipH");
            flashButton(button);
            flipH();
        },
        rotateR: function() {
            var button = document.getElementById("rotateR");
            flashButton(button);
            rotateR();
        },
        rotateL: function() {
            var button = document.getElementById("rotateL");
            flashButton(button);
            rotateL();
        },
        cinePlay: function() {
            toggleCinePlay();
        },
        defaultTool: function() {
            var tool = toolManager.getDefaultTool();
            toolManager.setActiveTool(tool);
        },
        toggleOverlayTags: function() {
            var dicomTags = $('.imageViewerViewportOverlay .dicomTag');
            if (dicomTags.eq(0).css('display') === 'none') {
                dicomTags.show();
            } else {
                dicomTags.hide();
            }
        }
    };
});

// Define a jQuery reverse function
$.fn.reverse = [].reverse;

function previousActivePanel() {
    log.info('nextActivePanel');
    var currentIndex = Session.get('activeViewport');
    currentIndex--;

    var viewports = $('.imageViewerViewport');
    var numViewports = viewports.length;
    if (currentIndex < 0) {
        currentIndex = numViewports - 1;
    }

    var element = viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
}


function nextActivePanel() {
    log.info('nextActivePanel');
    var currentIndex = Session.get('activeViewport');
    currentIndex++;

    var viewports = $('.imageViewerViewport');
    var numViewports = viewports.length;
    if (currentIndex >= numViewports) {
        currentIndex = 0;
    }

    var element = viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
}

function flashButton(button) {
    if (!button) {
        return;
    }

    button.classList.add('active');
    setTimeout(function () {
        button.classList.remove('active');
    }, 100);
}

function bindHotkey(hotkey, task) {
    var hotkeyFunctions = OHIF.viewer.hotkeyFunctions;

    // Only bind defined, non-empty HotKeys
    if (!hotkey || hotkey === "") {
        return;
    }

    var fn;
    if (task.indexOf("WLPreset") > -1) {
        var presetName = task.replace("WLPreset", "");
        fn = function() {
            applyWLPresetToActiveElement(presetName);
        };
    } else {
        fn = hotkeyFunctions[task];

        // If the function doesn't exist in the 
        // hotkey function list, try the viewer-specific function list
        if (!fn && OHIF.viewer && OHIF.viewer.functionList) {
            fn = OHIF.viewer.functionList[task];
        }
    }

    if (!fn) {
        return;
    }

    var hotKeyForBinding = hotkey.toLowerCase();

    $(document).bind('keydown', hotKeyForBinding, fn);
}

enableHotkeys = function() {
    var viewerHotkeys = OHIF.viewer.hotkeys;

    $(document).unbind('keydown');

    Object.keys(viewerHotkeys).forEach(function(task) {
        var taskHotkeys = viewerHotkeys[task];
        if (!taskHotkeys || !taskHotkeys.length) {
            return;
        }

        if (taskHotkeys.constructor === Array) {
            taskHotkeys.forEach(function(hotkey) {
                bindHotkey(hotkey, task);
            });
        } else {
            // taskHotkeys represents a single key
            bindHotkey(taskHotkeys, task);
        }
    });
};