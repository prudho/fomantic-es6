'use strict';

import { Module, ModuleOptions } from '../module';
import Utils from '../utils';

import { Transition } from './transition';

import $, { Cash } from 'cash-dom';

// Adds easing
// $.extend( $.easing, {
//   easeOutQuad: function (x, t, b, c, d) {
//     return -c *(t/=d)*(t-2) + b;
//   }
// });

export interface AccordionOptions extends ModuleOptions {
  on: string;

  observeChanges: boolean;

  exclusive: boolean;
  collapsible: boolean;
  closeNested: boolean;
  animateChildren: boolean;

  duration: number;
  easing: string;

  error: {
    method: string;
  }
  
  className: {
    active    : string;
    animating : string;
    transition: string;
  }

  selector: {
    accordion: string;
    title    : string;
    trigger  : string;
    content  : string;
  }

  onOpening       : Function;
  onClosing       : Function;
  onChanging      : Function;

  onOpen          : Function;
  onClose         : Function;
  onChange        : Function;
}

const default_settings: AccordionOptions = {
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

  onOpening       : function(){}, // callback before open animation
  onClosing       : function(){}, // callback before closing animation
  onChanging      : function(){}, // callback before closing or opening animation

  onOpen          : function(){}, // callback after open animation
  onClose         : function(){}, // callback after closing animation
  onChange        : function(){}, // callback after closing or opening animation
};

export class Accordion extends Module {
  settings: AccordionOptions;

  $title: Cash;
  $content: Cash;

  observer: MutationObserver;

  instance: Accordion;

  constructor(selector, parameters: AccordionOptions) {
    super(selector, parameters, default_settings);

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
          : $(this.element).closest(this.settings.selector.title),
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
        : $(this.element).closest(this.settings.selector.title),
      $activeContent = $activeTitle.next(this.$content),
      isAnimating = $activeContent.hasClass(this.settings.className.animating),
      isActive = $activeContent.hasClass(this.settings.className.active),
      isOpen = isActive || isAnimating;
    if (isOpen) {
      this.debug("Accordion already open, skipping", $activeContent);
      return;
    }
    this.debug("Opening accordion content", $activeTitle);
    this.settings.onOpening.call($activeContent);
    this.settings.onChanging.call($activeContent);
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
        new Transition($activeContent.children(), {
          animation: "fade in",
          queue: false,
          useFailSafe: true,
          debug: this.settings.debug,
          verbose: this.settings.verbose,
          duration: this.settings.duration,
          skipInlineHidden: true,
          onComplete: () => {
            $activeContent
              .children()
              .removeClass(this.settings.className.transition)
            ;
          }
        });
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
    Utils.slideDown($activeContent, this.settings.duration, () => {
      $activeContent
        .removeClass(this.settings.className.animating)
        .addClass(this.settings.className.active)
      ;
      this.reset_display.call(this, $activeContent);
      this.settings.onOpen.call(this);
      this.settings.onChange.call(this);
    });
  }

  close(query): void {
    let $activeTitle =
        query !== undefined
          ? typeof query === "number"
            ? this.$title.eq(query)
            : $(query).closest(this.settings.selector.title)
          : $(this.element).closest(this.settings.selector.title),
      $activeContent = $activeTitle.next(this.$content),
      isAnimating = $activeContent.hasClass(this.settings.className.animating),
      isActive = $activeContent.hasClass(this.settings.className.active),
      isOpening = !isActive && isAnimating,
      isClosing = isActive && isAnimating;
    if ((isActive || isOpening) && !isClosing) {
      this.debug("Closing accordion content", $activeContent);
      this.settings.onClosing.call($activeContent);
      this.settings.onChanging.call($activeContent);
      $activeTitle.removeClass(this.settings.className.active);
      $activeContent
        // .stop(true, true)
        .addClass(this.settings.className.animating)
      ;
      if (this.settings.animateChildren) {
        // if ($.fn.transition !== undefined && $module.transition("is supported")) {
        if (true) {
          new Transition($activeContent.children(), {
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
      Utils.slideUp($activeContent, this.settings.duration, () => {
        $activeContent
          .removeClass(this.settings.className.animating)
          .removeClass(this.settings.className.active);
        this.reset_display.call(this, $activeContent);
        this.settings.onClose.call(this);
        this.settings.onChange.call(this);
      });
    }
  }

  closeOthers(index): void {
    let 
      $activeTitle = index !== undefined
        ? typeof index === "number"
          ? this.$title.eq(index)
          : $(index).closest(this.settings.selector.title)
        : $(this.element).closest(this.settings.selector.title),
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
          new Transition($openContents.children(), {
            animation: "fade out",
            useFailSafe: true,
            debug: this.settings.debug,
            verbose: this.settings.verbose,
            duration: default_settings.duration,
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
      Utils.slideUp($openContents, this.settings.duration, () => {
        $($openContents).removeClass(this.settings.className.active);
        this.reset_display.call(this, $openContents);
      });
    }
  }

  reset_display($element): void {
    this.verbose("Removing inline display from element", $element);
    $($element).css("display", "");
    if ($($element).attr("style") === "") {
      $($element).attr("style", "").removeAttr("style");
    }
  }

  reset_opacity($element): void {
    this.verbose("Removing inline opacity from element", $element);
    $($element).css("opacity", "");
    if ($($element).attr("style") === "") {
      $($element).attr("style", "").removeAttr("style");
    }
  }
}
