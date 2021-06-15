"use strict";

export default class Utils {
  private static ease = {
    linear: (progress: number) => {
      return progress;
    },

    quadratic: function (progress: number) {
      return Math.pow(progress, 2);
    },
  
    swing: function (progress: number) {
      return 0.5 - Math.cos(progress * Math.PI) / 2;
    },
  
    circ: function (progress: number) {
      return 1 - Math.sin(Math.acos(progress));
    },

    bounce: function (progress: number) {
      for (let a = 0, b = 1; ; a += b, b /= 2) {
        if (progress >= (7 - 4 * a) / 11) {
          return -Math.pow((11 - 6 * a - 11 * progress) / 4, 2) + Math.pow(b, 2);
        }
      }
    }
  }

  static slideUp(target, duration: number = 500, callback: Function = () => {}) {
    target = target[0];
  
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.boxSizing = "border-box";
    target.style.height = target.offsetHeight + "px";
    target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;

    window.setTimeout(() => {
      target.style.display = "none";
      target.style.removeProperty("height");
      target.style.removeProperty("padding-top");
      target.style.removeProperty("padding-bottom");
      target.style.removeProperty("margin-top");
      target.style.removeProperty("margin-bottom");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      callback();
    }, duration);
  }

  static slideDown(target, duration: number = 500, callback: Function = () => {}) {
    target = target[0];
  
    target.style.removeProperty("display");
    let display = window.getComputedStyle(target).display;
    if (display === "none") display = "block";
    target.style.display = display;
    let height = target.offsetHeight;
    target.style.overflow = "hidden";
    target.style.height = 0;
    target.style.paddingTop = 0;
    target.style.paddingBottom = 0;
    target.style.marginTop = 0;
    target.style.marginBottom = 0;
    target.offsetHeight;
    target.style.boxSizing = "border-box";
    target.style.transitionProperty = "height, margin, padding";
    target.style.transitionDuration = duration + "ms";
    target.style.height = height + "px";
    target.style.removeProperty("padding-top");
    target.style.removeProperty("padding-bottom");
    target.style.removeProperty("margin-top");
    target.style.removeProperty("margin-bottom");
    
    window.setTimeout(() => {
      target.style.removeProperty("height");
      target.style.removeProperty("overflow");
      target.style.removeProperty("transition-duration");
      target.style.removeProperty("transition-property");
      callback();
    }, duration);
  }

  /**
   * Inspired from https://github.com/matteobad/vanilla-fade
   */
   private static animate (duration: number, easing: Function, animation: Function, complete: Function) {
    let timeStart;
  
    function _animate (time) {
      if (!timeStart) {
        timeStart = time;
      }
      
      const
        timeElapsed = time - timeStart,
        progress = Math.min(timeElapsed / duration, 1)
      ;
  
      animation(easing(progress));
  
      if (timeElapsed >= duration) {
        complete && complete();
      } else {
        window.requestAnimationFrame(_animate);
      }
    }
  
    return _animate;
  }

  private static fade (duration: number, opacity: number, easing: string, animation: Function, complete: Function) {  
    const draw = this.animate(duration, this.ease[easing], animation, complete);
    window.requestAnimationFrame(draw);
  }

  static fadeIn(target, duration: number = 500, easing: string = 'linear', complete: Function = null) {
    const
      startOpacity = parseFloat(window.getComputedStyle(target).opacity),
      finalOpacity = 1,
      _fadeIn = (progress: number) => {
        target.style.opacity = startOpacity + (finalOpacity - startOpacity) * progress;
      }
    ;
  
    if (startOpacity !== 1) {
      this.fade(duration, finalOpacity, easing, _fadeIn, complete);
    }
  }

  static fadeOut (target, duration: number = 250, easing: string = 'linear', complete: Function = null) {
    const
      startOpacity = parseFloat(window.getComputedStyle(target).opacity),
      finalOpacity = 0,
      _fadeOut = (progress) => {
        target.style.opacity = startOpacity - startOpacity * progress
      }
    ; 
  
    if (startOpacity !== 0) {
      this.fade(duration, finalOpacity, easing, _fadeOut, complete);
    }
  }
}