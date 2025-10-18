export { default as RTLText } from './RTLText';
export { default as RTLView } from './RTLView';
export { default as RTLButton } from './RTLButton';
export { default as RTLInput } from './RTLInput';
export { default as AlertFadeModal } from './AlertFadeModal';

// Default export for the primitives module
const Primitives = {
  RTLText: require('./RTLText').default,
  RTLView: require('./RTLView').default,
  RTLButton: require('./RTLButton').default,
  RTLInput: require('./RTLInput').default,
  AlertFadeModal: require('./AlertFadeModal').default,
};

export default Primitives;
