(function () {
  var glassCounter = 0;
  var SVG_NS = 'http:\x2F\x2Fwww.w3.org\x2F2000\x2Fsvg';

  function supportsSVGFilters(filterId) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    var ua = navigator.userAgent;
    var isWebkit = /Safari/.test(ua) && !/Chrome/.test(ua);
    var isFirefox = /Firefox/.test(ua);
    if (isWebkit || isFirefox) return false;
    var div = document.createElement('div');
    div.style.backdropFilter = 'url(#' + filterId + ')';
    return div.style.backdropFilter !== '';
  }

  function generateDisplacementMap(config, filterId, redGradId, blueGradId, softId) {
    var container = config.container;
    var rect = container.getBoundingClientRect();
    var actualWidth = Math.max(1, Math.round(rect.width || config.width));
    var actualHeight = Math.max(1, Math.round(rect.height || config.height));
    var edgeSize = Math.min(actualWidth, actualHeight) * (config.borderWidth * 0.5);
    var clampedEdgeW = Math.max(0, actualWidth - edgeSize * 2);
    var clampedEdgeH = Math.max(0, actualHeight - edgeSize * 2);

    var svgContent = '<svg width="' + actualWidth + '" height="' + actualHeight + '" viewBox="0 0 ' + actualWidth + ' ' + actualHeight + '" xmlns="' + SVG_NS + '">'
      + '<defs>'
      + '<linearGradient id="' + redGradId + '" x1="100%" y1="0%" x2="0%" y2="0%">'
      + '<stop offset="0%" stop-color="#0000"/>'
      + '<stop offset="100%" stop-color="red"/>'
      + '</linearGradient>'
      + '<linearGradient id="' + blueGradId + '" x1="0%" y1="0%" x2="0%" y2="100%">'
      + '<stop offset="0%" stop-color="#0000"/>'
      + '<stop offset="100%" stop-color="blue"/>'
      + '</linearGradient>'
      + '<filter id="' + softId + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' + actualWidth + '" height="' + actualHeight + '" color-interpolation-filters="sRGB">'
      + '<feGaussianBlur stdDeviation="' + config.blur + '"/>'
      + '</filter>'
      + '</defs>'
      + '<rect x="0" y="0" width="' + actualWidth + '" height="' + actualHeight + '" fill="black"></rect>'
      + '<rect x="0" y="0" width="' + actualWidth + '" height="' + actualHeight + '" rx="' + config.borderRadius + '" fill="url(#' + redGradId + ')"/>'
      + '<rect x="0" y="0" width="' + actualWidth + '" height="' + actualHeight + '" rx="' + config.borderRadius + '" fill="url(#' + blueGradId + ')" style="mix-blend-mode: ' + config.mixBlendMode + '"/>'
      + '<rect x="' + edgeSize + '" y="' + edgeSize + '" width="' + clampedEdgeW + '" height="' + clampedEdgeH + '" rx="' + config.borderRadius + '" fill="hsl(0 0% ' + config.brightness + '% / ' + config.opacity + ')" filter="url(#' + softId + ')"/>'
      + '</svg>';

    return 'data:image/svg+xml,' + encodeURIComponent(svgContent);
  }

  function initGlassSurface(container, options) {
    if (!container || container._glassInitialized) return;
    container._glassInitialized = true;

    var opts = options || {};
    var config = {
      container: container,
      width: opts.width != null ? opts.width : 320,
      height: opts.height != null ? opts.height : 76,
      borderRadius: opts.borderRadius != null ? opts.borderRadius : 38,
      borderWidth: opts.borderWidth != null ? opts.borderWidth : 0.07,
      brightness: opts.brightness != null ? opts.brightness : 50,
      opacity: opts.opacity != null ? opts.opacity : 0.93,
      blur: opts.blur != null ? opts.blur : 11,
      displace: opts.displace != null ? opts.displace : 0.5,
      backgroundOpacity: opts.backgroundOpacity != null ? opts.backgroundOpacity : 0.1,
      saturation: opts.saturation != null ? opts.saturation : 1,
      distortionScale: opts.distortionScale != null ? opts.distortionScale : -180,
      redOffset: opts.redOffset != null ? opts.redOffset : 0,
      greenOffset: opts.greenOffset != null ? opts.greenOffset : 10,
      blueOffset: opts.blueOffset != null ? opts.blueOffset : 20,
      xChannel: opts.xChannel || 'R',
      yChannel: opts.yChannel || 'G',
      mixBlendMode: opts.mixBlendMode || 'difference'
    };

    glassCounter++;
    var uid = 'gs-' + glassCounter;
    var filterId = 'glass-filter-' + uid;
    var redGradId = 'red-grad-' + uid;
    var blueGradId = 'blue-grad-' + uid;
    var softId = 'soft-' + uid;

    var svgSupported = supportsSVGFilters(filterId);
    var modeClass = svgSupported ? 'glass-surface--svg' : 'glass-surface--fallback';

    container.classList.remove('glass-surface--svg', 'glass-surface--fallback', 'glass-surface--webgl');
    container.classList.add('glass-surface', modeClass);
    container.style.width = typeof config.width === 'number' ? config.width + 'px' : config.width;
    container.style.height = typeof config.height === 'number' ? config.height + 'px' : config.height;
    container.style.borderRadius = config.borderRadius + 'px';
    container.style.setProperty('--glass-frost', config.backgroundOpacity);
    container.style.setProperty('--glass-saturation', config.saturation);
    container.style.setProperty('--filter-id', 'url(#' + filterId + ')');

    var filterSvg = container.querySelector('.glass-surface__filter');
    var feImage = null;

    if (!filterSvg) {
      filterSvg = document.createElementNS(SVG_NS, 'svg');
      filterSvg.setAttribute('class', 'glass-surface__filter');
      filterSvg.setAttribute('aria-hidden', 'true');

      var defs = document.createElementNS(SVG_NS, 'defs');
      var filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', filterId);
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      filter.setAttribute('x', '0%');
      filter.setAttribute('y', '0%');
      filter.setAttribute('width', '100%');
      filter.setAttribute('height', '100%');

      feImage = document.createElementNS(SVG_NS, 'feImage');
      feImage.setAttribute('x', '0');
      feImage.setAttribute('y', '0');
      feImage.setAttribute('width', '100%');
      feImage.setAttribute('height', '100%');
      feImage.setAttribute('preserveAspectRatio', 'none');
      feImage.setAttribute('result', 'map');

      var redDisp = document.createElementNS(SVG_NS, 'feDisplacementMap');
      redDisp.setAttribute('in', 'SourceGraphic');
      redDisp.setAttribute('in2', 'map');
      redDisp.setAttribute('id', 'redchannel');
      redDisp.setAttribute('scale', String(config.distortionScale + config.redOffset));
      redDisp.setAttribute('xChannelSelector', config.xChannel);
      redDisp.setAttribute('yChannelSelector', config.yChannel);
      redDisp.setAttribute('result', 'dispRed');

      var redMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      redMatrix.setAttribute('in', 'dispRed');
      redMatrix.setAttribute('type', 'matrix');
      redMatrix.setAttribute('values', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
      redMatrix.setAttribute('result', 'red');

      var greenDisp = document.createElementNS(SVG_NS, 'feDisplacementMap');
      greenDisp.setAttribute('in', 'SourceGraphic');
      greenDisp.setAttribute('in2', 'map');
      greenDisp.setAttribute('id', 'greenchannel');
      greenDisp.setAttribute('scale', String(config.distortionScale + config.greenOffset));
      greenDisp.setAttribute('xChannelSelector', config.xChannel);
      greenDisp.setAttribute('yChannelSelector', config.yChannel);
      greenDisp.setAttribute('result', 'dispGreen');

      var greenMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      greenMatrix.setAttribute('in', 'dispGreen');
      greenMatrix.setAttribute('type', 'matrix');
      greenMatrix.setAttribute('values', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0');
      greenMatrix.setAttribute('result', 'green');

      var blueDisp = document.createElementNS(SVG_NS, 'feDisplacementMap');
      blueDisp.setAttribute('in', 'SourceGraphic');
      blueDisp.setAttribute('in2', 'map');
      blueDisp.setAttribute('id', 'bluechannel');
      blueDisp.setAttribute('scale', String(config.distortionScale + config.blueOffset));
      blueDisp.setAttribute('xChannelSelector', config.xChannel);
      blueDisp.setAttribute('yChannelSelector', config.yChannel);
      blueDisp.setAttribute('result', 'dispBlue');

      var blueMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      blueMatrix.setAttribute('in', 'dispBlue');
      blueMatrix.setAttribute('type', 'matrix');
      blueMatrix.setAttribute('values', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0');
      blueMatrix.setAttribute('result', 'blue');

      var blendRG = document.createElementNS(SVG_NS, 'feBlend');
      blendRG.setAttribute('in', 'red');
      blendRG.setAttribute('in2', 'green');
      blendRG.setAttribute('mode', 'screen');
      blendRG.setAttribute('result', 'rg');

      var blendRGB = document.createElementNS(SVG_NS, 'feBlend');
      blendRGB.setAttribute('in', 'rg');
      blendRGB.setAttribute('in2', 'blue');
      blendRGB.setAttribute('mode', 'screen');
      blendRGB.setAttribute('result', 'output');

      var gaussBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
      gaussBlur.setAttribute('in', 'output');
      gaussBlur.setAttribute('stdDeviation', String(config.displace));

      filter.appendChild(feImage);
      filter.appendChild(redDisp);
      filter.appendChild(redMatrix);
      filter.appendChild(greenDisp);
      filter.appendChild(greenMatrix);
      filter.appendChild(blueDisp);
      filter.appendChild(blueMatrix);
      filter.appendChild(blendRG);
      filter.appendChild(blendRGB);
      filter.appendChild(gaussBlur);
      defs.appendChild(filter);
      filterSvg.appendChild(defs);

      container.insertBefore(filterSvg, container.firstChild);
    } else {
      feImage = filterSvg.querySelector('feImage');
    }

    var frosted = !svgSupported;
    var sheen = container.querySelector('.glass-surface__sheen');
    var rim = container.querySelector('.glass-surface__rim');

    if (frosted) {
      if (!sheen) {
        sheen = document.createElement('span');
        sheen.className = 'glass-surface__sheen';
        sheen.setAttribute('aria-hidden', 'true');
        container.insertBefore(sheen, filterSvg ? filterSvg.nextSibling : container.firstChild);
      }
      if (!rim) {
        rim = document.createElement('span');
        rim.className = 'glass-surface__rim';
        rim.setAttribute('aria-hidden', 'true');
        container.insertBefore(rim, sheen ? sheen.nextSibling : container.firstChild);
      }
    } else {
      if (sheen && sheen.parentNode) sheen.parentNode.removeChild(sheen);
      if (rim && rim.parentNode) rim.parentNode.removeChild(rim);
    }

    function updateMap() {
      if (feImage) {
        var mapUrl = generateDisplacementMap(config, filterId, redGradId, blueGradId, softId);
        feImage.setAttribute('href', mapUrl);
        feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', mapUrl);
      }
    }

    updateMap();

    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { updateMap(); });
      ro.observe(container);
    } else {
      window.addEventListener('resize', updateMap);
    }
  }

  function boot() {
    var navEl = document.getElementById('nav-glass-surface');
    if (navEl) {
      initGlassSurface(navEl, {
        width: 320,
        height: 76,
        borderRadius: 38,
        distortionScale: -180,
        displace: 0.5,
        backgroundOpacity: 0.1,
        blur: 11,
        brightness: 50,
        opacity: 0.93,
        borderWidth: 0.07,
        saturation: 1,
        redOffset: 0,
        greenOffset: 10,
        blueOffset: 20,
        xChannel: 'R',
        yChannel: 'G',
        mixBlendMode: 'difference'
      });
    }

    var others = document.querySelectorAll('[data-glass-surface="true"]');
    for (var i = 0; i < others.length; i++) {
      if (others[i].id !== 'nav-glass-surface') {
        initGlassSurface(others[i], {});
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.GlassSurface = { init: initGlassSurface };
})();
