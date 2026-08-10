#!/bin/bash
git add backend/app/core backend/app/db backend/alembic backend/app/main.py backend/app/api/v1/router.py
git commit -m "feat(backend): implement core infrastructure and routing"

git add backend/app/models backend/app/schemas backend/app/repositories
git commit -m "feat(backend): implement data models, schemas, and repositories"

git add backend/app/api
git commit -m "feat(backend): implement api endpoints and controllers"

git add backend/tests
git commit -m "test(backend): add comprehensive test suite"

git add backend
git commit -m "chore(backend): add seed scripts and remaining backend files"

git add frontend/src/components/ui
git commit -m "feat(frontend): implement premium monochrome ui design system"

git add frontend/src/components/layout frontend/src/components/providers
git commit -m "feat(frontend): implement application shell and context providers"

git add frontend/src/app/\(dashboard\)/schools frontend/src/app/\(dashboard\)/students
git commit -m "feat(frontend): implement school and student management interfaces"

git add frontend/src/app/\(dashboard\)/teachers frontend/src/app/\(dashboard\)/classes
git commit -m "feat(frontend): implement teacher and class management interfaces"

git add frontend/src/app
git commit -m "feat(frontend): implement authentication and role dashboards"

git add frontend
git commit -m "feat(frontend): add utility functions and api client configurations"

git add .
git commit -m "chore: final cleanup and documentation"

git push -u origin main
