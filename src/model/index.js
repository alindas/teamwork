import { configureStore } from '@reduxjs/toolkit';
import userReducer from './reducers/user';
import projectReducer from './reducers/project';

export default configureStore({
  reducer: {
    user: userReducer,
    project: projectReducer
  }
})
