'use strict';

import Module from '../module';
import Utils from '../utils';

import Transition from './transition';

import $, { Cash } from 'cash-dom';

// Adds easing
// $.extend( $.easing, {
//   easeOutQuad: function (x, t, b, c, d) {
//     return -c *(t/=d)*(t-2) + b;
//   }
// });

const settings = {
  name           : 'Accordion',
  namespace      : 'accordion',

  silent         : false,
  debug          : false,
  verbose        : false,
  performance    : true,

  on             : 'click', // event on title that opens accordion

  observeChanges : true, // whether accordion should automatically refresh on DOM insertion

  exclusive      : true, // whether a single accordion content panel should be open at once
  collapsible    : true, // whether accordion content can be closed
  closeNested    : false, // whether nested content should be closed when a panel is closed
  animateChildren: true, // whether children opacity should be animated

  duration       : 350, // duration of animation
  easing         : 'easeOutQuad', // easing equation for animation

  error: {
    method: 'The method you called is not defined',
  },

  className: {
    active    : 'active',
    animating : 'animating',
    transition: 'transition',
  },

  selector: {
    accordion: '.accordion',
    title    : '.title',
    trigger  : '.title',
    content  : '.content',
  },

  events: [
    'opening',  // callback before open animation
    'closing',  // callback before closing animation
    'changing', // callback before closing or opening animation
    'open',     // callback after open animation
    'close',    // callback after closing animation
    'change'    // callback after closing or opening animation
  ],
};

export class Accordion extends Module {
  $title: Cash;
  $content: Cash;

  observer: MutationObserver;

  instance: Accordion;

  constructor(selector, parameters) {
    super(selector, parameters, settings);

    this.$title = this.$element.find(this.settings.selector.title);
    this.$content = this.$element.find(this.settings.selector.content);

    this.initialize();
  }

  initialize(): void {
    this.debug("Initializing", this.$element);
    this.bind_events();
    if (this.settings.observeChanges) {
      this.observeChanges();
    }
    this.instantiate();
  }

  instantiate(): void {
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.debug("Destroying previous instance", this.$element);
    this.$element.off(this.eventNamespace).removeAttr(this.moduleNamespace);
  }

  refresh(): void {
    this.$title = this.$element.find(this.settings.selector.title);
    this.$content = this.$element.find(this.settings.selector.content);
  }

  observeChanges(): void {
    if ("MutationObserver" in window) {
      this.observer = new MutationObserver((mutations) => {
        this.debug("DOM tree modified, updating selector cache");
        this.refresh();
      });
      this.observer.observe(this.element, {
        childList : true,
        subtree   : true
      });
      this.debug("Setting up mutation observer", this.observer);
    }
  }

  bind_events(): void {
    this.debug("Binding delegated events");
    this.$element.on(
      this.settings.on + this.eventNamespace,
      this.settings.selector.trigger,
      this.event_click.bind(this)
    );
  }

  event_click(event): void {
    this.toggle.call(this, event.target);
  }

  toggle(query): void {
    let $activeTitle =
        query !== undefined
          ? typeof query === "number"
            ? this.$title.eq(query)
            : $(query).closest(this.settings.selector.title)
          : $(this).closest(this.settings.selector.title),
      $activeContent = $activeTitle.next(this.$content),
      isAnimating = $activeContent.hasClass(this.settings.className.animating),
      isActive = $activeContent.hasClass(this.settings.className.active),
      isOpen = isActive && !isAnimating,
      isOpening = !isActive && isAnimating
    ;
    this.debug("Toggling visibility of content", $activeTitle);
    if (isOpen || isOpening) {
      if (this.settings.collapsible) {
        this.close.call(this, $activeTitle);
      } else {
        this.debug("Cannot close accordion content collapsing is disabled");
      }
    } else {
      this.open.call(this, $activeTitle);
    }
  }

  open(query): void {
    let 
      $activeTitle = query !== undefined
        ? typeof query === "number"
          ? this.$title.eq(query)
          : $(query).closest(this.settings.selector.title)
        : $(this).closest(this.settings.selector.title),
      $activeContent = $activeTitle.next(this.$content),
      isAnimating = $activeContent.hasClass(this.settings.className.animating),
      isActive = $activeContent.hasClass(this.settings.className.active),
      isOpen = isActive || isAnimating;
    if (isOpen) {
      this.debug("Accordion already open, skipping", $activeContent);
      return;
    }
    this.debug("Opening accordion content", $activeTitle);
    // this.settings.onOpening.call($activeContent);
    // this.settings.onChanging.call($activeContent);
    this.invokeCallback('opening').call($activeContent);
    this.invokeCallback('changind').call($activeContent);
    if (this.settings.exclusive) {
      this.closeOthers.call(this, $activeTitle);
    }
    $activeTitle.addClass(this.settings.className.active);
    $activeContent
      //.stop(true, true)
      .addClass(this.settings.className.animating)
    ;
    if (this.settings.animateChildren) {
      // if ($.fn.transition !== undefined && $module.transition("is supported")) {
      if (true) {
        // $activeContent.children().transition({
        //   animation: "fade in",
        //   queue: false,
        //   useFailSafe: true,
        //   debug: settings.debug,
        //   verbose: settings.verbose,
        //   duration: settings.duration,
        //   skipInlineHidden: true,
        //   onComplete: function () {
        //     $activeContent
        //       .children()
        //       .removeClass(this.settings.className.transition);
        //   },
        // });

        const transition = new Transition($activeContent.children(), {
          animation: "fade in",
          queue: false,
          useFailSafe: true,
          debug: settings.debug,
          verbose: settings.verbose,
          duration: settings.duration,
          skipInlineHidden: true,
        });

        transition.on('complete', () => {
          $activeContent
            .children()
            .removeClass(this.settings.className.transition)
          ;
        })
      } else {
        // $activeContent
        //   .children()
        //     .stop(true, true)
        //     .animate({
        //       opacity: 1
        //     }, this.settings.duration, this.resetOpacity)
        // ;
      }
    }
    // $activeContent
    //   .slideDown(this.settings.duration, this.settings.easing, function() {
    //     $activeContent
    //       .removeClass(this.settings.className.animating)
    //       .addClass(this.settings.className.active)
    //     ;
    //     this.reset_display.call(this);
    //     this.settings.onOpen.call(this);
    //     this.settings.onChange.call(this);
    //   })
    // ;
    Utils.slideDown($activeContent, this.settings.duration, () => {
      $activeContent
        .removeClass(this.settings.className.animating)
        .addClass(this.settings.className.active)
      ;
      this.reset_display.call(this);
      // this.settings.onOpen.call(this);
      // this.settings.onChange.call(this);
      this.invokeCallback('open').call(this);
      this.invokeCallback('change').call(this);
    });
  }

  close(query): void {
    let $activeTitle =
        query !== undefined
          ? typeof query === "number"
            ? this.$title.eq(query)
            : $(query).closest(this.settings.selector.title)
          : $(this).closest(this.settings.selector.title),
      $activeContent = $activeTitle.next(this.$content),
      isAnimating = $activeContent.hasClass(this.settings.className.animating),
      isActive = $activeContent.hasClass(this.settings.className.active),
      isOpening = !isActive && isAnimating,
      isClosing = isActive && isAnimating;
    if ((isActive || isOpening) && !isClosing) {
      this.debug("Closing accordion content", $activeContent);
      // settings.onClosing.call($activeContent);
      // settings.onChanging.call($activeContent);
      this.invokeCallback('closing').call($activeContent);
      this.invokeCallback('changing').call($activeContent);
      $activeTitle.removeClass(this.settings.className.active);
      $activeContent
        // .stop(true, true)
        .addClass(this.settings.className.animating)
      ;
      if (this.settings.animateChildren) {
        // if ($.fn.transition !== undefined && $module.transition("is supported")) {
        if (true) {
          // $activeContent.children().transition({
          //   animation: "fade out",
          //   queue: false,
          //   useFailSafe: true,
          //   debug: this.settings.debug,
          //   verbose: this.settings.verbose,
          //   duration: this.settings.duration,
          //   skipInlineHidden: true,
          // });
          new Transition($activeContent, {
            animation: "fade out",
            queue: false,
            useFailSafe: true,
            debug: this.settings.debug,
            verbose: this.settings.verbose,
            duration: this.settings.duration,
            skipInlineHidden: true
          });
        } else {
          // $activeContent
          //   .children()
          //     .stop(true, true)
          //     .animate({
          //       opacity: 0
          //     }, this.settings.duration, this.resetOpacity)
          // ;
        }
      }
      // $activeContent
      //   .slideUp(this.settings.duration, this.settings.easing, function() {
      //     $activeContent
      //       .removeClass(this.settings.className.animating)
      //       .removeClass(this.settings.className.active)
      //     ;
      //     this.reset_display.call(this);
      //     this.settings.onClose.call(this);
      //     this.settings.onChange.call(this);
      //   })
      // ;
      Utils.slideUp($activeContent, this.settings.duration, () => {
        $activeContent
          .removeClass(this.settings.className.animating)
          .removeClass(this.settings.className.active);
        this.reset_display.call(this);
        // this.settings.onClose.call(this);
        // this.settings.onChange.call(this);
        this.invokeCallback('close').call(this);
        this.invokeCallback('change').call(this);
      });
    }
  }

  closeOthers(index): void {
    let 
      $activeTitle = index !== undefined
        ? typeof index === "number"
          ? this.$title.eq(index)
          : $(index).closest(this.settings.selector.title)
        : $(this).closest(this.settings.selector.title),
      $parentTitles = $activeTitle
        .parents(this.settings.selector.content)
        .prev(this.settings.selector.title),
      $activeAccordion = $activeTitle.closest(this.settings.selector.accordion),
      activeSelector = this.settings.selector.title + "." + this.settings.className.active,
      activeContent = this.settings.selector.content + "." + this.settings.className.active,
      $openTitles = $activeAccordion.find(activeSelector).not($parentTitles),
      $nestedTitles,
      $openContents
    ;
    if (this.settings.closeNested) {
      $openContents = $openTitles.next(this.$content);
    } else {
      $nestedTitles = $activeAccordion
        .find(activeContent)
        .find(activeSelector)
        .not($parentTitles);
      $openTitles = $openTitles.not($nestedTitles);
      $openContents = $openTitles.next(this.$content);
    }
    if ($openTitles.length > 0) {
      this.debug("Exclusive enabled, closing other content", $openTitles);
      $openTitles.removeClass(this.settings.className.active);
      $openContents.removeClass(this.settings.className.animating);
      //.stop(true, true)
      if (this.settings.animateChildren) {
        // if ($.fn.transition !== undefined && ) {
        if (true) {
          // $openContents.children().transition({
          //   animation: "fade out",
          //   useFailSafe: true,
          //   debug: this.settings.debug,
          //   verbose: this.settings.verbose,
          //   duration: settings.duration,
          //   skipInlineHidden: true,
          // });

          new Transition($openContents.children(), {
            animation: "fade out",
            useFailSafe: true,
            debug: this.settings.debug,
            verbose: this.settings.verbose,
            duration: settings.duration,
            skipInlineHidden: true
          });
        } else {
          // $openContents
          //   .children()
          //     .stop(true, true)
          //     .animate({
          //       opacity: 0
          //     }, this.settings.duration, this.resetOpacity)
          // ;
        }
      }
      // $openContents
      //   .slideUp(this.settings.duration , this.settings.easing, function() {
      //     $(this).removeClass(this.settings.className.active);
      //     this.reset_display.call(this);
      //   })
      // ;
      Utils.slideUp($openContents, this.settings.duration, () => {
        $(this).removeClass(this.settings.className.active);
        this.reset_display.call(this);
      });
    }
  }

  reset_display(): void {
    this.verbose("Removing inline display from element", this);
    $(this).css("display", "");
    if ($(this).attr("style") === "") {
      $(this).attr("style", "").removeAttr("style");
    }
  }

  reset_opacity(): void {
    this.verbose("Removing inline opacity from element", this);
    $(this).css("opacity", "");
    if ($(this).attr("style") === "") {
      $(this).attr("style", "").removeAttr("style");
    }
  }
}
