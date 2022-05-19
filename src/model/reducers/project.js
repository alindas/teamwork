import { createSlice } from '@reduxjs/toolkit'

export const counterSlice = createSlice({
  name: 'project',
  initialState: {
    projectId: -1,
    project: null,
    isAdmin: false,
  },
  reducers: {
    modifyProjectId: (state, action) => {
      state.projectId = action.payload
    },
    modifyProject: (state, action) => {
      const { projectId, project, isAdmin } = action.payload;
      return ({
        projectId: projectId??state.projectId,
        project: project??state.project,
        isAdmin: isAdmin??state.isAdmin,
      })
    },
  }
})

export const { modifyProjectId, modifyProject } = counterSlice.actions;

export default counterSlice.reducer;
