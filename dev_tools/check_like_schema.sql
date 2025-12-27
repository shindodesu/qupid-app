-- いいね機能のスキーマ確認用SQL
-- 問題: いいね送信時にエラーが表示されるが、実際には送信できている
-- 原因: レスポンススキーマと実際のデータ構造の不一致の可能性

-- ============================================
-- 1. likesテーブルの構造確認
-- ============================================
\d likes

-- または詳細な情報
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'likes'
ORDER BY ordinal_position;

-- ============================================
-- 2. usersテーブルの構造確認（レスポンスに含まれるフィールド）
-- ============================================
\d users

-- または詳細な情報
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================
-- 3. likesテーブルの制約確認
-- ============================================
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'likes'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- ============================================
-- 4. 実際のいいねデータの確認（サンプル）
-- ============================================
SELECT 
    id,
    liker_id,
    liked_id,
    created_at
FROM likes
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 5. マッチング成立時のデータ構造確認
-- ============================================
-- 双方向のいいね（マッチング）を確認
SELECT 
    l1.id AS like1_id,
    l1.liker_id AS user1_id,
    l1.liked_id AS user2_id,
    l1.created_at AS like1_created_at,
    l2.id AS like2_id,
    l2.liker_id AS user2_id,
    l2.liked_id AS user1_id,
    l2.created_at AS like2_created_at,
    GREATEST(l1.created_at, l2.created_at) AS matched_at
FROM likes l1
JOIN likes l2 ON l1.liker_id = l2.liked_id AND l1.liked_id = l2.liker_id
WHERE l1.liker_id < l1.liked_id  -- 重複を避ける
ORDER BY matched_at DESC
LIMIT 5;

-- ============================================
-- 6. レスポンスに含まれるユーザーフィールドの確認
-- ============================================
-- マッチング時に返されるユーザー情報のフィールドを確認
SELECT 
    id,
    display_name,
    bio,
    avatar_url,
    campus,
    faculty,
    grade,
    birthday,
    gender,
    sexuality,
    looking_for,
    profile_completed,
    is_active,
    created_at,
    show_faculty,
    show_grade,
    show_birthday,
    show_age,
    show_gender,
    show_sexuality,
    show_looking_for,
    show_bio,
    show_tags
FROM users
LIMIT 1;

