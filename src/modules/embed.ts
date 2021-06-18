"use strict";

import { Module, ModuleOptions } from '../module'

import $, { Cash } from 'cash-dom';

export interface EmbedOptions extends ModuleOptions {
  icon       : boolean;
  source     : boolean;
  url        : boolean;
  id         : boolean;
  placeholder: string

  // standard video settings
  autoplay  : boolean;
  color     : string;
  hd        : boolean;
  brandedUI : boolean;

  // additional parameters to include with the embed
  parameters: boolean;

  metadata    : {
    id          : string;
    icon        : string;
    placeholder : string;
    source      : string;
    url         : string;
  }

  error : {
    noURL  : string;
    method : string;
  }

  className : {
    active : string;
    embed  : string;
  }

  selector : {
    embed       : string;
    placeholder : string;
    icon        : string;
  }

  sources: {}

  templates: {
    iframe : Function;
    placeholder : Function;
  }

  onDisplay            : Function;
  onPlaceholderDisplay : Function;
  onReset              : Function;
  onCreate             : Function;
  onEmbed              : Function;

  // NOT YET IMPLEMENTED
  api     : false,
  onPause : Function;
  onPlay  : Function;
  onStop  : Function;
}

const default_settings: EmbedOptions = {
  name        : 'Embed',
  namespace   : 'embed',

  silent      : false,
  debug       : false,
  verbose     : false,
  performance : true,

  icon       : false,
  source     : false,
  url        : false,
  id         : false,
  placeholder: null,

  // standard video settings
  autoplay  : null,
  color     : '#444444',
  hd        : true,
  brandedUI : false,

  // additional parameters to include with the embed
  parameters: false,

  metadata    : {
    id          : 'id',
    icon        : 'icon',
    placeholder : 'placeholder',
    source      : 'source',
    url         : 'url'
  },

  error : {
    noURL  : 'No URL specified',
    method : 'The method you called is not defined'
  },

  className : {
    active : 'active',
    embed  : 'embed'
  },

  selector : {
    embed       : '.embed',
    placeholder : '.placeholder',
    icon        : '.icon'
  },

  sources: {
    youtube: {
      name   : 'youtube',
      type   : 'video',
      icon   : 'video play',
      domain : 'youtube.com',
      url    : '//www.youtube.com/embed/{id}',
      parameters: function(settings) {
        return {
          autohide       : !settings.brandedUI,
          autoplay       : settings.autoplay,
          color          : settings.color || undefined,
          hq             : settings.hd,
          jsapi          : settings.api,
          modestbranding : !settings.brandedUI
        };
      }
    },
    vimeo: {
      name   : 'vimeo',
      type   : 'video',
      icon   : 'video play',
      domain : 'vimeo.com',
      url    : '//player.vimeo.com/video/{id}',
      parameters: function(settings) {
        return {
          api      : settings.api,
          autoplay : settings.autoplay,
          byline   : settings.brandedUI,
          color    : settings.color || undefined,
          portrait : settings.brandedUI,
          title    : settings.brandedUI
        };
      }
    }
  },

  templates: {
    iframe : function(url, parameters) {
      let src = url;
      if (parameters) {
        src += '?' + parameters;
      }
      return ''
        + '<iframe src="' + src + '"'
        + ' width="100%" height="100%"'
        + ' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>'
      ;
    },
    placeholder : function(image: string, icon: string) {
      let html: string = '';
      if (icon) {
        html += `<i class="${icon} icon"></i>`;
      }
      if (image) {
        html += `<img class="placeholder" src="${image}">`;
      }
      return html;
    }
  },

  onDisplay            : function() {},
  onPlaceholderDisplay : function() {},
  onReset              : function() {},
  onCreate             : function(url) {},
  onEmbed              : function(parameters) {
    return parameters;
  },

  // NOT YET IMPLEMENTED
  api     : false,
  onPause : function() {},
  onPlay  : function() {},
  onStop  : function() {}
}

export class Embed extends Module {
  settings: EmbedOptions;

  $placeholder: Cash;
  $icon: Cash;
  $embed: Cash;

  instance: Embed;

  constructor(selector: string, parameters) {
    super(selector, parameters, default_settings);

    this.$placeholder    = this.$element.find(this.settings.selector.placeholder);
    this.$icon           = this.$element.find(this.settings.selector.icon);
    this.$embed          = this.$element.find(this.settings.selector.embed);

    this.initialize();
  }

  initialize(): void {
    this.debug('Initializing embed');
    this.determine_autoplay();
    this.create();
    this.bind_events();
    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this);
  }

  destroy(): void {
    this.verbose('Destroying previous instance of embed');
    this.reset();
    this.$element
      .removeAttr(this.moduleNamespace)
      .off(this.eventNamespace)
    ;
  }

  create(): void {
    let placeholder = this.get_placeholder();
    if (placeholder) {
      this.createPlaceholder();
    }
    else {
      this.createAndShow();
    }
  }

  createEmbed(url = this.get_url()) {
    this.refresh();
    this.$embed = $('<div/>')
      .addClass(this.settings.className.embed)
      .html(this.generate_embed(url))
      .appendTo(this.$element)
    ;
    this.settings.onCreate.call(this.element, url);
    this.debug('Creating embed object', this.$embed);
  }

  createPlaceholder(placeholder = this.get_placeholder()) {
    let
      icon  = this.get_icon(),
      url   = this.get_url(),
      embed = this.generate_embed(url)
    ;
    this.$element.html(this.settings.templates.placeholder(placeholder, icon));
    this.debug('Creating placeholder for embed', placeholder, icon);
  }

  createAndShow() {
    this.createEmbed();
    this.show();
  }

  generate_embed(url = this.get_url()) {
    this.debug('Generating embed html');
    let
      source = this.get_source(),
      html,
      parameters
    ;
    if (url) {
      parameters = this.generate_parameters(source);
      html       = this.settings.templates.iframe(url, parameters);
    }
    else {
      this.error(this.settings.error.noURL, this.$element);
    }
    return html;
  }

  generate_parameters(source, extraParameters = this.settings.parameters): string {
    let
      parameters = (this.settings.sources[source] && this.settings.sources[source].parameters !== undefined)
        ? this.settings.sources[source].parameters(this.settings)
        : {}
    ;
    if (extraParameters) {
      parameters = $.extend({}, parameters, extraParameters);
    }
    parameters = this.settings.onEmbed(parameters);
    return this.encode_parameters(parameters);
  }

  changeEmbed(url): void {
    this.$embed.html(this.generate_embed(url));
  }

  // sets new embed
  change(source, id, url): void {
    this.debug('Changing video to ', source, id, url);
    this.$element
      .data(this.settings.metadata.source, source)
      .data(this.settings.metadata.id, id)
    ;
    if (url) {
      this.$element.data(this.settings.metadata.url, url);
    }
    else {
      this.$element.removeAttr(this.settings.metadata.url);
    }
    if (this.has_embed()) {
      this.changeEmbed(url);
    }
    else {
      this.create();
    }
  }

  has_embed(): boolean {
    return (this.$embed.length > 0);
  }

  has_placeholder(): boolean {
    return this.settings.placeholder || this.$element.data(this.settings.metadata.placeholder);
  }

  determine_autoplay() {
    if (this.should_autoplay()) {
      this.settings.autoplay = true;
    }
  }

  bind_events(): void {
    if (this.has_placeholder()) {
      this.debug('Adding placeholder events');
      this.$element
        .on('click' + this.eventNamespace, this.settings.selector.placeholder, this.createAndShow.bind(this))
        .on('click' + this.eventNamespace, this.settings.selector.icon, this.createAndShow.bind(this))
      ;
    }
  }

  showPlaceholder() {
    this.debug('Showing placeholder image');
    this.remove_active();
    this.settings.onPlaceholderDisplay.call(this.element);
  }

  show(): void {
    this.debug('Showing embed');
    this.set_active();
    this.settings.onDisplay.call(this.element);
  }

  hide(): void {
    this.debug('Hiding embed');
    this.showPlaceholder();
  }

  refresh(): void {
    this.verbose('Refreshing selector cache');
    this.$placeholder = this.$element.find(this.settings.selector.placeholder);
    this.$icon        = this.$element.find(this.settings.selector.icon);
    this.$embed       = this.$element.find(this.settings.selector.embed);
  }

  reset(): void {
    this.debug('Clearing embed and showing placeholder');
    this.remove_data();
    this.remove_active();
    this.remove_embed();
    this.showPlaceholder();
    this.settings.onReset.call(this.element);
  }

  should_autoplay(): boolean {
    return (this.settings.autoplay === null)
      ? (this.settings.placeholder !== null || this.$element.data(this.settings.metadata.placeholder) !== undefined)
      : this.settings.autoplay
    ;
  }

  determine_source(url: string = this.get_url()) {
    let matchedSource: any = false;
    if (url) {
      $.each(this.settings.sources, (name, source: any) => {
        if (url.search(source.domain) !== -1) {
          matchedSource = name;
          return false;
        }
      });
    }
    return matchedSource;
  }

  determine_icon() {
    let source = this.get_source();
    return (this.settings.sources[source] !== undefined)
      ? this.settings.sources[source].icon
      : false
    ;
  }

  determine_url(): string {
    let
      id     = this.settings.id     || this.$element.data(this.settings.metadata.id),
      source = this.settings.source || this.$element.data(this.settings.metadata.source),
      url
    ;
    url = (this.settings.sources[source] !== undefined)
      ? this.settings.sources[source].url.replace('{id}', id)
      : false
    ;
    if (url) {
      this.$element.data(this.settings.metadata.url, url);
    }
    return url;
  }

  get_placeholder(): string {
    return this.settings.placeholder || this.$element.data(this.settings.metadata.placeholder);
  }

  id(): string {
    return this.settings.id || this.$element.data(this.settings.metadata.id);
  }
  
  get_icon() {
    return (this.settings.icon)
      ? this.settings.icon
      : (this.$element.data(this.settings.metadata.icon) !== undefined)
        ? this.$element.data(this.settings.metadata.icon)
        : this.determine_icon()
    ;
  }
  
  get_source() {
    return (this.settings.source)
      ? this.settings.source
      : (this.$element.data(this.settings.metadata.source) !== undefined)
        ? this.$element.data(this.settings.metadata.source)
        : this.determine_source()
    ;
  }
  
  get_type() {
    let source = this.get_source();
    return (this.settings.sources[source] !== undefined)
      ? this.settings.sources[source].type
      : false
    ;
  }
  
  get_url(): string {
    return (this.settings.url)
      ? this.settings.url
      : (this.$element.data(this.settings.metadata.url) !== undefined)
        ? this.$element.data(this.settings.metadata.url)
        : this.determine_url()
    ;
  }

  set_active(): void {
    this.$element.addClass(this.settings.className.active);
  }

  remove_data(): void {
    this.$element
      .removeAttr(this.settings.metadata.id)
      .removeAttr(this.settings.metadata.icon)
      .removeAttr(this.settings.metadata.placeholder)
      .removeAttr(this.settings.metadata.source)
      .removeAttr(this.settings.metadata.url)
    ;
  }

  remove_active() {
    this.$element.removeClass(this.settings.className.active);
  }

  remove_embed(): void {
    this.$embed.empty();
  }

  encode_parameters(parameters): string {
    let urlString = [];
    for (let index in parameters) {
      urlString.push(encodeURIComponent(index) + '=' + encodeURIComponent(parameters[index]));
    }
    return urlString.join('&amp;');
  }

  is_video(): boolean {
    return this.get_type() == 'video';
  }
}
    