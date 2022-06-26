import { UserMoveConfig, Handler, EventTypes } from '@use-gesture/core/types';
import { Recognizer } from './Recognizer';
interface MoveGestureConstructor {
    new <EventType = EventTypes['move']>(target: EventTarget, handler: Handler<'move', EventType>, config?: UserMoveConfig): MoveGesture;
}
export interface MoveGesture extends Recognizer<'move'> {
}
export declare const MoveGesture: MoveGestureConstructor;
export {};
