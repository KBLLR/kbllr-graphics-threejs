import { UserScrollConfig, Handler, EventTypes } from '@use-gesture/core/types';
import { Recognizer } from './Recognizer';
interface ScrollGestureConstructor {
    new <EventType = EventTypes['scroll']>(target: EventTarget, handler: Handler<'scroll', EventType>, config?: UserScrollConfig): ScrollGesture;
}
export interface ScrollGesture extends Recognizer<'scroll'> {
}
export declare const ScrollGesture: ScrollGestureConstructor;
export {};
