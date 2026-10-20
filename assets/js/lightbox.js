import PhotoSwipeLightbox from "./photoswipe/photoswipe-lightbox.esm.js";
import PhotoSwipe from "./photoswipe/photoswipe.esm.js";
import PhotoSwipeDynamicCaption from "./photoswipe/photoswipe-dynamic-caption-plugin.esm.min.js";
import * as params from "@params";

const gallery = document.getElementById("gallery");

const isTouch = window.matchMedia("(pointer: coarse)").matches;
const BORDER = isTouch ? 2 : 6;
const SPACING = 24;

document.documentElement.style.setProperty("--lightbox-border", BORDER + "px");

// Border touches the screen edge, except in fullscreen on desktop where a gap is kept.
function getPadding() {
  const p = !isTouch && document.fullscreenElement ? SPACING : BORDER;
  return { top: p, bottom: p, left: p, right: p };
}

if (gallery) {
  const lightbox = new PhotoSwipeLightbox({
    gallery,
    children: ".gallery-item",
    showHideAnimationType: "zoom",
    bgOpacity: 1,
    pswpModule: PhotoSwipe,
    imageClickAction: "close",
    closeTitle: params.closeTitle,
    zoomTitle: params.zoomTitle,
    arrowPrevTitle: params.arrowPrevTitle,
    arrowNextTitle: params.arrowNextTitle,
    errorMsg: params.errorMsg,
    paddingFn: getPadding,
  });

  // The placeholder (thumbnail shown while loading) is rendered 250px wide and
  // scaled up with a transform, which would scale its border too. Compensate.
  lightbox.on("contentResize", ({ content, width }) => {
    const placeholder = content.placeholder?.element;
    if (placeholder?.tagName === "IMG" && width) {
      placeholder.style.boxShadow = `0 0 0 calc(var(--lightbox-border) * ${250 / width}) #fff`;
    }
  });

  // Padding depends on fullscreen state, so recalculate when it changes
  document.addEventListener("fullscreenchange", () => {
    lightbox.pswp?.updateSize(true);
  });

  if (document.fullscreenEnabled) {
    lightbox.on("uiRegister", () => {
      lightbox.pswp.ui.registerElement({
        name: "fullscreen-button",
        order: 9,
        isButton: true,
        title: params.fullscreenTitle || "Fullscreen",
        html: {
          isCustomSVG: true,
          inner: '<path d="M9 9h5v2h-3v3H9Zm14 0v5h-2v-3h-3V9ZM9 23v-5h2v3h3v2Zm14 0h-5v-2h3v-3h2Z" id="pswp__icn-fullscreen"/>',
          outlineID: "pswp__icn-fullscreen",
        },
        onClick: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        },
      });
    });
  }

  if (params.enableDownload) {
    lightbox.on("uiRegister", () => {
      lightbox.pswp.ui.registerElement({
        name: "download-button",
        order: 8,
        isButton: true,
        tagName: "a",
        html: {
          isCustomSVG: true,
          inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
          outlineID: "pswp__icn-download",
        },
        onInit: (el, pswp) => {
          el.setAttribute("download", "");
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
          el.setAttribute("title", params.downloadTitle || "Download");
          pswp.on("change", () => {
            el.href = pswp.currSlide.data.element.href;
          });
        },
      });
    });
  }

  lightbox.on("change", () => {
    const element = lightbox.pswp.currSlide?.data?.element;
    const target = element?.dataset["pswpTarget"];
    history.replaceState("", document.title, "#" + target);

    const thumbnail = element?.querySelector("img")?.dataset["src"];
    if (thumbnail && !isTouch) {
      lightbox.pswp.element.classList.add("pswp--blur-bg");
      lightbox.pswp.bg.style.backgroundImage = `url("${thumbnail}")`;
    }
  });

  lightbox.on("close", () => {
    history.replaceState("", document.title, window.location.pathname);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  new PhotoSwipeDynamicCaption(lightbox, {
    mobileLayoutBreakpoint: 700,
    type: "auto",
    mobileCaptionOverlapRatio: 1,
  });

  lightbox.init();

  if (window.location.hash.substring(1).length > 1) {
    const target = window.location.hash.substring(1);
    const items = gallery.querySelectorAll("a");
    for (let i = 0; i < items.length; i++) {
      if (items[i].dataset["pswpTarget"] === target) {
        lightbox.loadAndOpen(i, { gallery });
        break;
      }
    }
  }
}
