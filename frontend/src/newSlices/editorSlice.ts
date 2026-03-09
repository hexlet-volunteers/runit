import { createSlice } from '@reduxjs/toolkit';
import { CodeState } from 'src/types/slices';


const initialState: CodeState = {
  editorCode: 'заглушка',
  scriptValue: `<script src="https://sandbox.example.com/widget.js"></script>`, //мок данные
  iframeValue: `<iframe src="https://ваш-сайт.ru/sandbox/123" width="100%" height="400"></iframe>`, //мок данные
};

const codeSlice = createSlice({
  name: 'code',
  initialState,
  reducers: {
    setEditorCode(state, {payload}) {
      state.editorCode = payload;
    },
    setScriptValue(state, {payload}) {
      state.scriptValue = payload;
    },
    setIframeValue(state, {payload}) {
      state.iframeValue = payload;
    },
  },
});

export const { actions } = codeSlice;
export default codeSlice.reducer;