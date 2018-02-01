IF NOT git diff-index --quiet HEAD (
    ECHO "There are uncommitted changes:"
    git status --short
    ECHO "Doing nothing to avoid losing your work."
    EXIT 1
)

set request_id="%1"
set remote=%2 OR "upstream"
git fetch "%remote%" "pull/%request_id%/head"
git checkout -B "review-original-%request_id%"
git reset --hard FETCH_HEAD
