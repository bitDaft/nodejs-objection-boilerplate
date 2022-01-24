import Layer from 'express/lib/router/layer.js';
import { standardSuccessHandler } from '#lib/responseHandlers';
import { Success } from '#lib/responseHelpers';

let successLayer = new Layer('/', {}, standardSuccessHandler);

const handleSuccessWrapper =
  (fn) =>
  async (...args) => {
    const output = await fn(...args);
    const [response, wrapSuccess = true] = Array.isArray(output) ? output : [output];
    const [req, res, next] = args;
    if (response instanceof Success) {
      req.x = response;
    } else if (response === res) {
      // # Nothing to do here
      // ^ The response is being sent as a stream
      if (!res.headersSent) console.log(new Success('Streaming data'));
      return;
    } else if (response !== undefined && response !== null) {
      let simpleValue = response;
      if (!isNaN(+response)) simpleValue = +response + '';
      let wrappedSimpleValue = new Success(simpleValue);
      if (!wrapSuccess) {
        if (res.headersSent) {
          console.log('[Success] Sent already:', simpleValue);
          return;
        }
        console.log(wrappedSimpleValue);
        return res.status(200).send(simpleValue);
      }
      req.x = wrappedSimpleValue;
    }
    return next();
  };

export const injectSuccessHandlerMiddleware = ({ path = '/', stack }) => {
  for (let layer of stack) {
    if (layer.method) {
      layer.handle = handleSuccessWrapper(layer.handle);
      return stack.push(successLayer);
    } else if (layer.route?.stack.length) {
      injectSuccessHandlerMiddleware(layer.route);
    } else if (layer.handle?.stack.length) {
      injectSuccessHandlerMiddleware(layer.handle);
    }
  }
};