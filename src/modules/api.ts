"use strict";

import { Module, ModuleOptions } from '../module';

import $, { Cash } from 'cash-dom';

/*!
 * Serialize all form data into an object of key/value pairs
 * (c) 2020 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Node}   form The form to serialize
 * @return {Object}      The serialized form data
 */
const serializeObject = function (form) {
	let obj = {};
	Array.prototype.slice.call(form.elements).forEach(function (field) {
		if (!field.name || field.disabled || ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1) return;
		if (field.type === 'select-multiple') {
			let options = [];
			Array.prototype.slice.call(field.options).forEach(function (option) {
				if (!option.selected) return;
				options.push(option.value);
			});
			if (options.length) {
				obj[field.name] = options;
			}
			return;
		}
		if (['checkbox', 'radio'].indexOf(field.type) >-1 && !field.checked) return;
		obj[field.name] = field.value;
	});
	return obj;
};

function deferred() {
  let thens = []
  let catches = []

  var status = 'pending';
  let resolvedValue
  let rejectedError

  return {
    status: status,
    resolveWith: (context, value) => {
      status = 'resolved'
      resolvedValue = value
      thens.forEach(t => t.apply(context, value))
      thens = [] // Avoid memleaks.
    },
    resolve: value => {
      status = 'resolved'
      resolvedValue = value
      thens.forEach(t => t(value))
      thens = [] // Avoid memleaks.
    },
    rejectWith: (context, error) => {
      status = 'rejected'
      rejectedError = error
      catches.forEach(c => c.apply(context, error))
      catches = [] // Avoid memleaks.
    },
    reject: error => {
      status = 'rejected'
      rejectedError = error
      catches.forEach(c => c(error))
      catches = [] // Avoid memleaks.
    },
    always: cb => {
      cb(
        (status === 'resolved')
          ? resolvedValue
          : (status === 'rejected')
            ? 'rejectedError'
            : status
      );
    },
    then: cb => {
      if (status === 'resolved') {
        cb(resolvedValue)
      } else {
        thens.unshift(cb)
      }
    },
    catch: cb => {
      if (status === 'rejected') {
        cb(rejectedError)
      } else {
        catches.unshift(cb)
      }
    },
    state: () => {
      return status;
    }
  }
}

export interface ApiOptions extends ModuleOptions {
  api?: object;
  cache?: string;
  interruptRequests?: boolean;
  on?: string;
  stateContext?: string;
  loadingDuration?: number;
  hideError?: boolean;
  errorDuration?: number;
  encodeParameters?: boolean;
  action?: string;
  url?: boolean;
  base?: string;
  urlData?: {};
  defaultData?: boolean;
  serializeForm?: boolean;
  throttle?: number;
  throttleFirstRequest?: boolean;

  method?            : string;
  data?              : {};
  dataType?          : string;

  mockResponse?      : boolean;
  mockResponseAsync? : boolean;

  response?          : boolean;
  responseAsync?     : boolean;

  rawResponse?       : boolean;

  successTest?       : Function;

  error? : {
    beforeSend        : string;
    error             : string;
    exitConditions    : string;
    JSONParse         : string;
    legacyParameters  : string;
    method            : string;
    missingAction     : string;
    missingSerialize  : string;
    missingURL        : string;
    noReturnedValue   : string;
    noStorage         : string;
    parseError        : string;
    requiredParameter : string;
    statusMessage     : string;
    timeout           : string;
  }

  regExp?  : {
    required : RegExp;
    optional : RegExp;
  }

  className?: {
    loading : string;
    error   : string;
  }

  selector?: {
    disabled : string;
    form     : string;
  }

  metadata?: {
    action  : string;
    url     : string;
  }

  // callbacks before request
  beforeSend?  : Function;
  beforeXHR?   : Function;
  onRequest?   : Function;

  // after request
  onResponse?  : Function;

  // response was successful, if JSON passed validation
  onSuccess?   : Function;

  // request finished without aborting
  onComplete?  : Function;

  // failed JSON success test
  onFailure?   : Function;

  // server error
  onError?     : Function;

  // request aborted
  onAbort?     : Function;
}

const default_settings: ApiOptions = {
  name              : 'API',
  namespace         : 'api',

  silent            : false,
  debug             : false,
  verbose           : false,
  performance       : true,

  // object containing all templates endpoints
  api               : {},

  // whether to cache responses
  cache             : null,

  // whether new requests should abort previous requests
  interruptRequests : true,

  // event binding
  on                : 'auto',

  // context for applying state classes
  stateContext      : null,

  // duration for loading state
  loadingDuration   : 0,

  // whether to hide errors after a period of time
  hideError         : null,

  // duration for error state
  errorDuration     : 2000,

  // whether parameters should be encoded with encodeURIComponent
  encodeParameters  : true,

  // API action to use
  action            : null,

  // templated URL to use
  url               : false,

  // base URL to apply to all endpoints
  base              : '',

  // data that will
  urlData           : {},

  // whether to add default data to url data
  defaultData          : true,

  // whether to serialize closest form
  serializeForm        : false,

  // how long to wait before request should occur
  throttle             : 0,

  // whether to throttle first request or only repeated
  throttleFirstRequest : true,

  // standard ajax settings
  method            : 'get',
  data              : {},
  dataType          : 'json',

  // mock response
  mockResponse      : false,
  mockResponseAsync : false,

  // aliases for mock
  response          : false,
  responseAsync     : false,

// whether onResponse should work with response value without force converting into an object
  rawResponse       : false,

  successTest : null,

  // errors
  error : {
    beforeSend        : 'The before send function has aborted the request',
    error             : 'There was an error with your request',
    exitConditions    : 'API Request Aborted. Exit conditions met',
    JSONParse         : 'JSON could not be parsed during error handling',
    legacyParameters  : 'You are using legacy API success callback names',
    method            : 'The method you called is not defined',
    missingAction     : 'API action used but no url was defined',
    missingSerialize  : 'jquery-serialize-object is required to add form data to an existing data object',
    missingURL        : 'No URL specified for api event',
    noReturnedValue   : 'The beforeSend callback must return a settings object, beforeSend ignored.',
    noStorage         : 'Caching responses locally requires session storage',
    parseError        : 'There was an error parsing your request',
    requiredParameter : 'Missing a required URL parameter: ',
    statusMessage     : 'Server gave an error: ',
    timeout           : 'Your request timed out'
  },

  regExp  : {
    required : /\{\$*[A-z0-9]+\}/g,
    optional : /\{\/\$*[A-z0-9]+\}/g,
  },

  className: {
    loading : 'loading',
    error   : 'error'
  },

  selector: {
    disabled : '.disabled',
    form      : 'form'
  },

  metadata: {
    action  : 'action',
    url     : 'url'
  },

  // callbacks before request
  beforeSend  : function(settings) { return settings; },
  beforeXHR   : function(xhr) {},
  onRequest   : function(promise, xhr) {},

  // after request
  onResponse  : null, // function(response) { },

  // response was successful, if JSON passed validation
  onSuccess   : function(response, $module) {},

  // request finished without aborting
  onComplete  : function(response, $module) {},

  // failed JSON success test
  onFailure   : function(response, $module) {},

  // server error
  onError     : function(errorMessage, $module) {},

  // request aborted
  onAbort     : function(errorMessage, $module) {}
}

export class Api extends Module {
  settings: ApiOptions;

  $context: Cash;
  $form: Cash;

  context;
  request;

  // request details
  xhr: XMLHttpRequest;
  mockedXHR;
  cancelled: boolean;
  ajaxSettings;
  requestSettings;
  url;
  data;
  requestStartTime: number;

  timer: any;
  cache;

  instance: Api;

  private _xhr: XMLHttpRequest;

  constructor(parameters: ApiOptions) {
    super(null, parameters, default_settings);

    // context used for state
    this.$context        = (this.settings.stateContext)
      ? $(this.settings.stateContext)
      : this.$element
    ;

    this.context         = this.$context[0];
    this.$form           = this.$element.closest(this.settings.selector.form);

    this.initialize();
  }

  initialize(): void {
    this.bind_events();

    this.instantiate();
  }

  instantiate(): void {
    this.verbose('Storing instance of module', this);
    this.instance = this;
    this.$element.data(this.moduleNamespace, this.instance);
  }

  destroy(): void {
    this.verbose('Destroying previous module for', this.element);
    this.$element
      .removeAttr(this.moduleNamespace)
      .off(this.eventNamespace)
    ;
  }

  bind_events(): void {
    let triggerEvent = this.get_event();
    if (triggerEvent) {
      this.verbose('Attaching API events to element', triggerEvent);
      this.$element.on(triggerEvent + this.eventNamespace, this.event_trigger)}
    else if (this.settings.on == 'now') {
      this.debug('Querying API endpoint immediately');
      this.query();
    }
  }

  event_request_complete(firstParameter, secondParameter) {
    let
      xhr,
      response
    ;
    // have to guess callback parameters based on request success
    if (this.was_successful()) {
      response = firstParameter;
      xhr      = secondParameter;
    }
    else {
      xhr      = firstParameter;
      response = this.get_responseFromXHR(xhr);
    }
    this.remove_loading();
    this.settings.onComplete.call(this.context, response, this.$element, xhr);
  }

  event_request_done(response, xhr) {
    this.debug('Successful API Response', response);
    if (this.settings.cache === 'local' && this.url) {
      this.write_cachedResponse(this.url, response);
      this.debug('Saving server response locally', this.cache);
    }
    this.settings.onSuccess.call(this.context, response, this.$element, xhr);
  }

  event_request_fail(xhr, status, httpMessage) {
    let
      // pull response from xhr if available
      response     = this.get_responseFromXHR(xhr),
      errorMessage = this.get_errorFromRequest(response, status, httpMessage)
    ;
    if (status == 'aborted') {
      this.debug('XHR Aborted (Most likely caused by page navigation or CORS Policy)', status, httpMessage);
      this.settings.onAbort.call(this.context, status, this.$element, xhr);
      return true;
    }
    else if (status == 'invalid') {
      this.debug('JSON did not pass success test. A server-side error has most likely occurred', response);
    }
    else if (status == 'error') {
      if (xhr !== undefined) {
        this.debug('XHR produced a server error', status, httpMessage);
        // make sure we have an error to display to console
        if ((xhr.status < 200 || xhr.status >= 300) && httpMessage !== undefined && httpMessage !== '') {
          this.error(this.settings.error.statusMessage + httpMessage, this.ajaxSettings.url);
        }
        this.settings.onError.call(this.context, errorMessage, this.$element, xhr);
      }
    }

    if (this.settings.errorDuration && status !== 'aborted') {
      this.debug('Adding error state');
      this.set_error();
      if (this.should_removeError()) {
        setTimeout(this.remove_error.bind(this), this.settings.errorDuration);
      }
    }
    this.debug('API Request failed', errorMessage, xhr);
    this.settings.onFailure.call(this.context, response, this.$element, xhr);
  }

  event_trigger(event) {
    this.query();
    if (event.type == 'submit' || event.type == 'click') {
      event.preventDefault();
    }
  }

  event_xhr_always(): void {
    // nothing special
  }

  event_xhr_complete(): void {
    // nothing special
  }

  event_xhr_done(response, textStatus, xhr) {
    let
      context            = this,
      elapsedTime        = (new Date().getTime() - this.requestStartTime),
      timeLeft           = (default_settings.loadingDuration - elapsedTime),
      translatedResponse = ( $.isFunction(default_settings.onResponse) )
        ? this.is_expectingJSON() && !default_settings.rawResponse
          ? default_settings.onResponse.call(context, $.extend(true, {}, response))
          : default_settings.onResponse.call(context, response)
        : false
    ;
    timeLeft = (timeLeft > 0)
      ? timeLeft
      : 0
    ;
    if (translatedResponse) {
      this.debug('Modified API response in onResponse callback', default_settings.onResponse, translatedResponse, response);
      response = translatedResponse;
    }
    if (timeLeft > 0) {
      this.debug('Response completed early delaying state change by', timeLeft);
    }
    setTimeout(() => {
      if (this.is_validResponse(response)) {
        // module.request.resolveWith(context, [response, xhr]);
        this.request.resolveWith(context, [response, xhr]);
      }
      else {
        // module.request.rejectWith(context, [xhr, 'invalid']);
        this.request.rejectWith(context, [xhr, 'invalid']);
      }
    }, timeLeft);
  }

  event_xhr_fail(xhr, status, httpMessage) {
    let
      context     = this,
      elapsedTime = (new Date().getTime() - this.requestStartTime),
      timeLeft    = (default_settings.loadingDuration - elapsedTime)
    ;
    timeLeft = (timeLeft > 0)
      ? timeLeft
      : 0
    ;
    if (timeLeft > 0) {
      this.debug('Response completed early delaying state change by', timeLeft);
    }
    setTimeout(() => {
      if (this.is_abortedRequest(xhr)) {
        this.request.rejectWith(context, [xhr, 'aborted', httpMessage]);
      }
      else {
        this.request.rejectWith(context, [xhr, 'error', status, httpMessage]);
      }
    }, timeLeft);
  }

  get_event() {
    if ($.isWindow(this.element) || this.settings.on == 'now') {
      this.debug('API called without element, no events attached');
      return false;
    }
    else if (this.settings.on == 'auto') {
      if (this.$element.is('input')) {
        return (this.element.oninput !== undefined)
          ? 'input'
          : (this.element.onpropertychange !== undefined)
            ? 'propertychange'
            : 'keyup'
        ;
      }
      else if (this.$element.is('form')) {
        return 'submit';
      }
      else {
        return 'click';
      }
    }
    else {
      return this.settings.on;
    }
  }

  // reset state
  reset(): void {
    this.remove_error();
    this.remove_loading();
  }

  query() {
    if (this.is_disabled()) {
      this.debug('Element is disabled API request aborted');
      return;
    }

    if (this.is_loading()) {
      if (this.settings.interruptRequests) {
        this.debug('Interrupting previous request');
        this.abort();
      }
      else {
        this.debug('Cancelling request, previous request is still pending');
        return;
      }
    }

    // pass element metadata to url (value, text)
    if (this.settings.defaultData) {
      $.extend(true, this.settings.urlData, this.get_defaultData());
    }

    // Add form content
    if (this.settings.serializeForm) {
      this.settings.data = this.add_formData(this.settings.data);
    }

    // call beforesend and get any settings changes
    this.requestSettings = this.get_settings();

    // check if before send cancelled request
    if (this.requestSettings === false) {
      this.cancelled = true;
      this.error(this.settings.error.beforeSend);
      return;
    }
    else {
      this.cancelled = false;
    }

    // get url
    this.url = this.get_templatedURL();

    if (!this.url && !this.is_mocked()) {
      this.error(this.settings.error.missingURL);
      return;
    }

    // replace variables
    this.url = this.add_urlData(this.url);
    // missing url parameters
    if (!this.url && !this.is_mocked()) {
      return;
    }

    this.requestSettings.url = this.settings.base + this.url;

    // look for jQuery ajax parameters in settings
    this.ajaxSettings = $.extend(true, {}, this.settings, {
      type       : this.settings.method,
      data       : this.data,
      url        : this.settings.base + this.url,
      beforeSend : this.settings.beforeXHR,
      success    : function() {},
      failure    : function() {},
      complete   : function() {}
    });

    this.debug('Querying URL', this.ajaxSettings.url);
    this.verbose('Using AJAX settings', this.ajaxSettings);
    if (this.settings.cache === 'local' && this.read_cachedResponse(this.url)) {
      this.debug('Response returned from local cache');
      this.request = this.create_request();
      this.request.resolveWith(this.context, [ this.read_cachedResponse(this.url) ]);
      return;
    }

    if (!this.settings.throttle) {
      this.debug('Sending request', this.data, this.ajaxSettings.method);
      this.send_request();
    }
    else {
      if (!default_settings.throttleFirstRequest && !this.timer) {
        this.debug('Sending request', this.data, this.ajaxSettings.method);
        this.send_request();
        this.timer = setTimeout(function() {}, default_settings.throttle);
      }
      else {
        this.debug('Throttling request', default_settings.throttle);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          if (this.timer) {
            delete this.timer;
          }
          this.debug('Sending throttled request', this.data, this.ajaxSettings.method);
          this.send_request();
        }, this.settings.throttle);
      }
    }
  }

  abort() {
    let xhr = this.get_xhr();
    if (xhr && xhr.statusText !== 'resolved') {
      this.debug('Cancelling API request');
      xhr.abort();
    }
  }

  create_mockedXHR() {
    let
      // xhr does not simulate these properties of xhr but must return them
      textStatus     = false,
      status         = false,
      httpMessage    = false,
      responder      = this.settings.mockResponse      || this.settings.response,
      asyncResponder = this.settings.mockResponseAsync || this.settings.responseAsync,
      asyncCallback,
      response,
      mockedXHR
    ;

    // mockedXHR = Deferred()
    //   .always(this.event_xhr_complete)
    //   .done(this.event_xhr_done)
    //   .fail(this.event_xhr_fail)
    // ;

    mockedXHR = deferred()
      // .always(this.event_xhr_complete)
    ;

    mockedXHR.always(this.event_xhr_complete);
    mockedXHR.catch(this.event_xhr_fail);
    mockedXHR.then(this.event_xhr_done);

    if (responder) {
      if ($.isFunction(responder)) {
        this.debug('Using specified synchronous callback', responder);
        response = responder.call(this.context, this.requestSettings);
      }
      else {
        this.debug('Using settings specified response', responder);
        response = responder;
      }
      // simulating response
      mockedXHR.resolveWith(this.context, [ response, textStatus, { responseText: response }]);
    }
    else if ($.isFunction(asyncResponder)) {
      asyncCallback = function(response) {
        this.debug('Async callback returned response', response);

        if (response) {
          mockedXHR.resolveWith(this.context, [ response, textStatus, { responseText: response }]);
        }
        else {
          mockedXHR.rejectWith(this.context, [{ responseText: response }, status, httpMessage]);
        }
      };
      this.debug('Using specified async response callback', asyncResponder);
      asyncResponder.call(this.context, this.requestSettings, asyncCallback);
    }
    return mockedXHR;
  }

  create_request() {
    // api request promise
    // return $.Deferred()
    //   .always(this.event_request_complete.bind(this))
    //   .done(this.event_request_done.bind(this))
    //   .fail(this.event_request_fail.bind(this))
    // ;

    let def = deferred();

    def.always(this.event_request_complete.bind(this));
    def.catch(this.event_request_fail.bind(this));
    def.then(this.event_request_done.bind(this));

    return def;
  }

  create_xhr(): XMLHttpRequest {
    // ajax request promise
    // xhr = $.ajax(this.ajaxSettings)
    //   .always(this.event_xhr_always)
    //   .done(this.event_xhr_done)
    //   .fail(this.event_xhr_fail)
    // ;

    let module = this;

    this._xhr = new XMLHttpRequest();

    this._xhr.open(this.ajaxSettings.method, this.ajaxSettings.url, true);

    this._xhr.onerror = function () {
      module.event_xhr_fail(this, this.status, this.response);
    }

    this._xhr.onload = function () {
      module.event_xhr_done(this.response, this.statusText, this);
    }

    this.verbose('Created server request', this._xhr, this.ajaxSettings);
    return this._xhr;
  }

  send_request() {
    this.set_loading();
    this.request = this.create_request();
    if (this.is_mocked()) {
      this.mockedXHR = this.create_mockedXHR();
    }
    else {
      this.xhr = this.create_xhr();
      this.xhr.send();
    }
    this.settings.onRequest.call(this.context, this.request, this.xhr);
  }

  read_cachedResponse(url) {
    let response;
    if (window.Storage === undefined) {
      this.error(this.settings.error.noStorage);
      return;
    }
    response = sessionStorage.getItem(url);
    this.debug('Using cached response', url, response);
    response = this.decode_json(response);
    return response;
  }

  add_formData(data) {
    let
      canSerialize = (serializeObject !== undefined),
      formData     = (canSerialize)
        ? serializeObject(this.$form)
        : this.$form.serialize(),
      hasOtherData
    ;
    data         = data || this.settings.data;
    hasOtherData = $.isPlainObject(data);

    if (hasOtherData) {
      if (canSerialize) {
        this.debug('Extending existing data with form data', data, formData);
        data = $.extend(true, {}, data, formData);
      }
      else {
        this.error(this.settings.error.missingSerialize);
        this.debug('Cant extend data. Replacing data with form data', data, formData);
        data = formData;
      }
    }
    else {
      this.debug('Adding form data', formData);
      data = formData;
    }
    return data;
  }

  add_urlData(url, urlData = null) {
    if (url) {
      let
        requiredVariables = url.match(this.settings.regExp.required),
        optionalVariables = url.match(this.settings.regExp.optional)
      ;
      urlData = urlData || this.settings.urlData;
      console.log(urlData);
      if (requiredVariables) {
        this.debug('Looking for required URL variables', requiredVariables);
        $.each(requiredVariables, (_index, templatedString: string) => {
          let
            // allow legacy {$var} style
            variable = (templatedString.indexOf('$') !== -1)
              ? templatedString.substr(2, templatedString.length - 3)
              : templatedString.substr(1, templatedString.length - 2),
            value   = ($.isPlainObject(urlData) && urlData[variable] !== undefined)
              ? urlData[variable]
              : (this.$element.data(variable) !== undefined)
                ? this.$element.data(variable)
                : (this.$context.data(variable) !== undefined)
                  ? this.$context.data(variable)
                  : urlData[variable]
          ;
          // remove value
          if (value === undefined) {
            this.error(this.settings.error.requiredParameter, variable, url);
            url = false;
            return false;
          }
          else {
            this.verbose('Found required variable', variable, value);
            value = (default_settings.encodeParameters)
              ? this.get_urlEncodedValue(value)
              : value
            ;
            url = url.replace(templatedString, value);
          }
        });
      }
      if (optionalVariables) {
        this.debug('Looking for optional URL variables', requiredVariables);
        $.each(optionalVariables, (_index, templatedString: string) => {
          let
            // allow legacy {/$var} style
            variable = (templatedString.indexOf('$') !== -1)
              ? templatedString.substr(3, templatedString.length - 4)
              : templatedString.substr(2, templatedString.length - 3),
            value   = ($.isPlainObject(urlData) && urlData[variable] !== undefined)
              ? urlData[variable]
              : (this.$element.data(variable) !== undefined)
                ? this.$element.data(variable)
                : (this.$context.data(variable) !== undefined)
                  ? this.$context.data(variable)
                  : urlData[variable]
          ;
          // optional replacement
          if (value !== undefined) {
            this.verbose('Optional variable Found', variable, value);
            url = url.replace(templatedString, value);
          }
          else {
            this.verbose('Optional variable not found', variable);
            // remove preceding slash if set
            if (url.indexOf('/' + templatedString) !== -1) {
              url = url.replace('/' + templatedString, '');
            }
            else {
              url = url.replace(templatedString, '');
            }
          }
        });
      }
    }
    return url;
  }

  decode_json(response) {
    if (response !== undefined && typeof response == 'string') {
      try {
       response = JSON.parse(response);
      }
      catch(e) {
        // isnt json string
      }
    }
    return response;
  }

  is_abortedRequest(xhr): boolean {
    if (xhr && xhr.readyState !== undefined && xhr.readyState === 0) {
      this.verbose('XHR request determined to be aborted');
      return true;
    }
    else {
      this.verbose('XHR request was not aborted');
      return false;
    }
  }

  is_disabled(): boolean {
    return (this.$element.filter(this.settings.selector.disabled).length > 0);
  }

  is_expectingJSON(): boolean {
    return this.settings.dataType === 'json' || this.settings.dataType === 'jsonp';
  }

  is_form(): boolean {
    return this.$element.is('form') || this.$context.is('form');
  }

  is_input(): boolean {
    return this.$element.is('input');
  }

  is_loading(): boolean {
    return (this.request)
      ? (this.request.state() == 'pending')
      : false
    ;
  }

  is_mocked(): boolean {
    return (this.settings.mockResponse || this.settings.mockResponseAsync || this.settings.response || this.settings.responseAsync);
  }

  is_validResponse(response): boolean {
    if ((!this.is_expectingJSON()) || !$.isFunction(this.settings.successTest)) {
      this.verbose('Response is not JSON, skipping validation', this.settings.successTest, response);
      return true;
    }
    this.debug('Checking JSON returned success', this.settings.successTest, response);
    if (this.settings.successTest(response)) {
      this.debug('Response passed success test', response);
      return true;
    }
    else {
      this.debug('Response failed success test', response);
      return false;
    }
  }

  was_cancelled(): boolean {
    return (this.cancelled || false);
  }

  was_complete(): boolean {
    return (this.request && (this.request.state() == 'resolved' || this.request.status == 'rejected') );
  }

  was_failure(): boolean {
    return (this.request && this.request.state() == 'rejected');
  }

  was_successful(): boolean {
    return (this.request && this.request.state() == 'resolved');
  }

  should_removeError(): boolean {
    return ( this.settings.hideError === true || (this.settings.hideError === null && !this.is_form()) );
  }

  get_defaultData() {
    let data: any = {};
    if (!$.isWindow(this.element)) {
      if (this.is_input()) {
        data.value = this.$element.val();
      }
      else if (this.is_form()) {

      }
      else {
        data.text = this.$element.text();
      }
    }
    return data;
  }

  get_errorFromRequest(response, status, httpMessage) {
    return ($.isPlainObject(response) && response.error !== undefined)
      ? response.error // use json error message
      : (this.settings.error[status] !== undefined) // use server error message
        ? this.settings.error[status]
        : httpMessage
    ;
  }

  get_request() {
    return this.request || false;
  }

  get_responseFromXHR(xhr) {
    return $.isPlainObject(xhr)
      ? (this.is_expectingJSON())
        ? this.decode_json(xhr.responseText)
        : xhr.responseText
      : false
    ;
  }

  get_settings() {
    let runSettings;
    runSettings = this.settings.beforeSend.call(this.$element, this.settings);
    if (runSettings) {
      if (runSettings.success !== undefined) {
        this.debug('Legacy success callback detected', runSettings);
        this.error(this.settings.error.legacyParameters, runSettings.success);
        runSettings.onSuccess = runSettings.success;
      }
      if (runSettings.failure !== undefined) {
        this.debug('Legacy failure callback detected', runSettings);
        this.error(this.settings.error.legacyParameters, runSettings.failure);
        runSettings.onFailure = runSettings.failure;
      }
      if (runSettings.complete !== undefined) {
        this.debug('Legacy complete callback detected', runSettings);
        this.error(this.settings.error.legacyParameters, runSettings.complete);
        runSettings.onComplete = runSettings.complete;
      }
    }
    if (runSettings === undefined) {
      this.error(this.settings.error.noReturnedValue);
    }
    if (runSettings === false) {
      return runSettings;
    }
    return (runSettings !== undefined)
      ? $.extend(true, {}, runSettings)
      : $.extend(true, {}, this.settings)
    ;
  }

  get_templatedURL(action: string = this.$element.data(this.settings.metadata.action) || this.settings.action || false) {
    this.url    = this.$element.data(this.settings.metadata.url) || this.settings.url || false;
    if (this.url) {
      this.debug('Using specified url', this.url);
      return this.url;
    }
    if (action) {
      this.debug('Looking up url for action', action, this.settings.api);
      if (this.settings.api[action] === undefined && !this.is_mocked()) {
        this.error(this.settings.error.missingAction, this.settings.action, this.settings.api);
        return;
      }
      this.url = this.settings.api[action];
    }
    else if (this.is_form()) {
      this.url = this.$element.attr('action') || this.$context.attr('action') || false;
      this.debug('No url or action specified, defaulting to form action', this.url);
    }
    return this.url;
  }

  get_urlEncodedValue(value) {
    let
      decodedValue   = window.decodeURIComponent(value),
      encodedValue   = window.encodeURIComponent(value),
      alreadyEncoded = (decodedValue !== value)
    ;
    if (alreadyEncoded) {
      this.debug('URL value is already encoded, avoiding double encoding', value);
      return value;
    }
    this.verbose('Encoding value using encodeURIComponent', value, encodedValue);
    return encodedValue;
  }

  get_xhr() {
    return this.xhr || false;
  }

  set_error(): void {
    this.verbose('Adding error state to element', this.$context);
    this.$context.addClass(this.settings.className.error);
  }

  set_loading(): void {
    this.verbose('Adding loading state to element', this.$context);
    this.$context.addClass(this.settings.className.loading);
    this.requestStartTime = new Date().getTime();
  }

  remove_error(): void {
    this.verbose('Removing error state from element', this.$context);
    this.$context.removeClass(this.settings.className.error);
  }

  remove_loading(): void {
    this.verbose('Removing loading state from element', this.$context);
    this.$context.removeClass(this.settings.className.loading);
  }

  write_cachedResponse(url, response): void {
    if (response && response === '') {
      this.debug('Response empty, not caching', response);
      return;
    }
    if (window.Storage === undefined) {
      this.error(this.settings.error.noStorage);
      return;
    }
    if ($.isPlainObject(response)) {
      response = JSON.stringify(response);
    }
    sessionStorage.setItem(url, response);
    this.verbose('Storing cached response for url', url, response);
  }
}
