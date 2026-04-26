import { defineComponent, useUnmount, useMount } from '../lib/main';
import { useParentContext } from './Parent';

export default defineComponent({
  name: 'child',
  setup(el) {
    const { isOpen, onOpen, onClose } = useParentContext();
    const onToggle = () => (isOpen.value ? onClose() : onOpen());

    el.addEventListener('click', onToggle);

    useMount(() => {
      console.log('child:mount');

      return () => {
        console.log('child:mount:unmount');
      };
    });

    useUnmount(() => {
      console.log('child:unmount');
    });

    useUnmount(() => {
      el.removeEventListener('click', onToggle);
    });

    return {
      test: () => {
        //
      },
    };
  },
});
