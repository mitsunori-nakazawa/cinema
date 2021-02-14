/* jshint curly:true, debug:true */
/* globals $, firebase */

//ユーザーID
let currentUID;

// プロフィール画像を設定していないユーザのデフォルト画像
const defaultProfileImageURL = './images/no-image';

/**
 * -------------------
 * 映画一覧画面関連の関数
 * -------------------
 */

// 映画の表紙画像をダウンロードする
const downloadMovieImage = movieImageLocation => firebase
  .storage()
  .ref(movieImageLocation)
  .getDownloadURL() // movie-images/abcdef のようなパスから画像のダウンロードURLを取得
  .catch((error) => {
    console.error('写真のダウンロードに失敗:', error);
    defaultProfileImageURL;
  });

// 映画の表紙画像を表示する
const displayMovieImage = ($divTag, url) => {
  $divTag.find('.movie-item__image').attr({
    src: url,
  });
};



// Realtime Database の movies から映画を削除する
const deleteMovie = (movieId) => {
  // TODO: movies から該当の映画データを削除
  firebase
   .database()
  // .ref('movies/' + movieId)
   .ref(`movies/${currentUID}/${movieId}`)
   .remove();

};

// 映画の表示用のdiv（jQueryオブジェクト）を作って返す
const createMovieDiv = (movieId, movieData, movieGenre, movieCountry, movieSearch) => {
  // HTML内のテンプレートからコピーを作成する
  const $divTag = $('#movie-template > .movie-item').clone();

  // TODO 追加した入力項目の値を表示する
  $divTag.find('.movie-item__genre').text(movieData.movieGenre);
  $divTag.find('.movie-item__country').text(movieData.movieCountry);
  // 映画タイトルを表示する
  $divTag.find('.movie-item__title').text(movieData.movieTitle);
  $divTag.find('.movie-item__rating').text(movieData.movieSearch);
  
  
  // 映画の表紙画像をダウンロードして表示する
  downloadMovieImage(movieData.movieImageLocation).then((url) => {
    displayMovieImage($divTag, url);
  });

  // id属性をセット
  $divTag.attr('id', `movie-id-${movieId}`);

  // 削除ボタンのイベントハンドラを登録
  const $deleteButton = $divTag.find('.movie-item__delete');
  $deleteButton.on('click', () => {
    deleteMovie(movieId);
  });

  return $divTag;
};

// 映画一覧画面内の書籍データをクリア
const resetMovieshelfView = () => {
  $('#movie-list').empty();
};

// 映画一覧画面に書籍データを表示する
const addMovie = (movieId, movieData, movieGenre, movieCountry, movieSearch) => {
  const $divTag = createMovieDiv(movieId, movieData);
  $divTag.appendTo('#movie-list');
};

// 映画一覧画面の初期化、イベントハンドラ登録処理
const loadMovieshelfView = () => {
  resetMovieshelfView();

  // 映画データを取得
  const moviesRef = firebase
    .database()
    // .ref('movies')
    .ref(`movies/${currentUID}`)
    .orderByChild('createdAt');

  // 過去に登録したイベントハンドラを削除
  moviesRef.off('child_removed');
  moviesRef.off('child_added');

  // movies の child_removedイベントハンドラを登録
  // （データベースから映画が削除されたときの処理）
  moviesRef.on('child_removed', (movieSnapshot) => {
    const movieId = movieSnapshot.key;
    const $movie = $(`#movie-id-${movieId}`);

  // TODO: 映画一覧画面から該当の映画データを削除する
   $movie.remove();
  });

  // movies の child_addedイベントハンドラを登録
  // （データベースに映画が追加保存されたときの処理）
  moviesRef.on('child_added', (movieSnapshot) => {
    const movieId = movieSnapshot.key;
    const movieData = movieSnapshot.val();

    // 映画一覧画面に映画データを表示する
    addMovie(movieId, movieData);
  });
};

/**
 * ----------------------
 * すべての画面共通で使う関数
 * ----------------------
 */

// ビュー（画面）を変更する
const showView = (id) => {
  $('.view').hide();
  $(`#${id}`).fadeIn();

  if (id === 'movieshelf') {
    loadMovieshelfView();
  }
};


/**
 * -------------------------
 * ログイン・ログアウト関連の関数
 * -------------------------
 */

// ログインフォームを初期状態に戻す
const resetLoginForm = () => {
  $('#login__help').hide();
  $('#login__submit-button')
    .prop('disabled', false)
    .text('ログイン');
};

// ログインした直後に呼ばれる
const onLogin = () => {
  console.log('ログイン完了');

  // 映画一覧画面を表示
  showView('movieshelf');
};

// ログアウトした直後に呼ばれる
const onLogout = () => {
  const moviesRef = firebase.database().ref('movies');
  

  // 過去に登録したイベントハンドラを削除
  moviesRef.off('child_removed');
  moviesRef.off('child_added');

  showView('login');
};



// ユーザ作成のときパスワードが弱すぎる場合に呼ばれる
const onWeakPassword = () => {
  resetLoginForm();
  $('.login__password').addClass('has-error');
  $('#login__help')
    .text('6文字以上のパスワードを入力してください')
    .fadeIn();
};

// ログインのときパスワードが間違っている場合に呼ばれる
const onWrongPassword = () => {
  resetLoginForm();
  $('.login__password').addClass('has-error');
  $('#login__help')
    .text('正しいパスワードを入力してください')
    .fadeIn();
};

// ログインのとき試行回数が多すぎてブロックされている場合に呼ばれる
// const onTooManyRequests = () => {
//   resetLoginForm();
//   $('#login__submit-button').prop('disabled', true);
//   $('#login__help')
//     .text('試行回数が多すぎます。後ほどお試しください。')
//     .fadeIn();
// };

// ログインのときメールアドレスの形式が正しくない場合に呼ばれる
const onInvalidEmail = () => {
  resetLoginForm();
  $('.login__email').addClass('has-error');
  $('#login__help')
    .text('メールアドレスを正しく入力してください')
    .fadeIn();
};

// その他のログインエラーの場合に呼ばれる
const onOtherLoginError = () => {
  resetLoginForm();
  $('#login__help')
    .text('ログインに失敗しました')
    .fadeIn();
};

$(function() {
    const password  = $('#login-password');
    const passcheck = $('#js-passcheck');
    
    $(passcheck).change(function() {
        if ($(this).prop('checked')) {
            $(password).attr('type','text');
        } else {
            $(password).attr('type','password');
        }
    });
});

/**
 * ---------------------------------------
 * 以下、コールバックやイベントハンドラの登録と、
 * ページ読み込みが完了したタイミングで行うDOM操作
 * ---------------------------------------
 */
 
 
 
 

/**
 * --------------------
 * ログイン・ログアウト関連
 * --------------------
 */

// ユーザ作成に失敗したことをユーザに通知する
const catchErrorOnCreateUser = (error) => {
  // 作成失敗
  console.error('ユーザ作成に失敗:', error);
  if (error.code === 'auth/weak-password') {
    onWeakPassword();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};

// ログインに失敗したことをユーザーに通知する
const catchErrorOnSignIn = (error) => {
  if (error.code === 'auth/wrong-password') {
    // パスワードの間違い
    onWrongPassword();
  } //else if (error.code === 'auth/too-many-requests') {
    // 試行回数多すぎてブロック中
    // onTooManyRequests();
  // } 
  else if (error.code === 'auth/invalid-email') {
    // メールアドレスの形式がおかしい
    onInvalidEmail();
  } else {
    // その他のエラー
    onOtherLoginError(error);
  }
};

// ログイン状態の変化を監視する
firebase.auth().onAuthStateChanged((user) => {
  // ログイン状態が変化した
  if (user) {
    // ログイン済
    currentUID = user.uid;
    onLogin();
  } else {
    // 未ログイン
    currentUID = null;
    onLogout();
  }
});

// ログインフォームが送信されたらログインする
$('#login-form').on('submit', (e) => {
  e.preventDefault();

  // フォームを初期状態に戻す
  resetLoginForm();

  // ログインボタンを押せないようにする
  $('#login__submit-button')
    .prop('disabled', true)
    .text('送信中…');

  const email = $('#login-email').val();
  const password = $('#login-password').val();

  /**
   * ログインを試みて該当ユーザが存在しない場合は新規作成する
   * まずはログインを試みる
   */
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .catch((error) => {
      console.log('ログイン失敗:', error);
      if (error.code === 'auth/user-not-found') {
        // 該当ユーザが存在しない場合は新規作成する
        firebase
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            // 作成成功
            console.log('ユーザを作成しました');
          })
          .catch(catchErrorOnCreateUser);
      } else {
        catchErrorOnSignIn(error);
      }
    });
 
    // フォームを初期状態に戻す
      resetLoginForm();
      
    // ログインボタンを元に戻す
      $('#login__submit-button').text('ログイン');
      
});


// ログアウトがクリックされたらログアウトする
$('.logout-button').on('click', (e) => {
  e.preventDefault();


  firebase
    .auth()
    .signOut()
    .then(() => {
      // ログアウト成功
      window.location.hash = '';
    })
    .catch((error) => {
      console.error('ログアウトに失敗:', error);
    });
});










/**
 * -------------------------
 * 映画情報追加モーダル関連の処理
 * -------------------------
 */

// 映画の登録モーダルを初期状態に戻す
const resetAddBookModal = () => {
  $('#movie-form')[0].reset();
  $('#add-movie-image-label').text('');
  $('#submit_add_movie')
    .prop('disabled', false)
    .text('保存する');
};

// 選択した表紙画像の、ファイル名を表示する
$('#add-movie-image').on('change', (e) => {
  const input = e.target;
  const $label = $('#add-movie-image-label');
  const file = input.files[0];

  if (file != null) {
    $label.text(file.name);
  } else {
    $label.text('ファイルを選択');
  }
});

// 映画一覧画面の映画の登録モーダルを閉じて、初期状態に戻す
$('.close-modal').on('click', () => {
  resetAddBookModal(); 
});

// 映画の登録処理
$('#movie-form').on('submit', (e) => {
  e.preventDefault();

  // 映画の登録ボタンを押せないようにする
  $('#submit_add_movie')
    .prop('disabled', true)
    .text('送信中…');

  // TODO: 追加した入力項目の値を取得する
  // 映画ジャンル
  const movieGenre = $('#add-movie-genre').val();
  // 映画タイトル
  const movieTitle = $('#add-movie-title').val();
  //
  const movieCountry = $('#add-movie-country').val();
  //評価
  const movieSearch = $('#add-movie-rating').val();
  // const movieEvaluation = $('.');
  // console.log(movieEvaluation);
  
  const $movieImage = $('#add-movie-image');
  const { files } = $movieImage[0];

  if (files.length === 0) {
    // ファイルが選択されていないなら何もしない
    return;
  }

  const file = files[0]; // 表紙画像ファイル
  const filename = file.name; // 画像ファイル名
  const movieImageLocation = `movie-images/${filename}`; // 画像ファイルのアップロード先

  // 映画データを保存する
  firebase
    .storage()
    .ref(movieImageLocation)
    .put(file) // Storageへファイルアップロードを実行
    .then(() => {
      // Storageへのアップロードに成功したら、Realtime Databaseに映画データを保存する
      const movieData = {
        // TODO: 追加した入力項目の値を設定する
        movieTitle,
        movieGenre,
        movieCountry,
        movieImageLocation,
        movieSearch,
        // movieEvaluation, 
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      };
      return firebase
        .database()
        // .ref(`movies`)
        .ref(`movies/${currentUID}`)
        .push(movieData);
    })
    .then(() => {
      // 映画一覧画面の映画の登録モーダルを閉じて、初期状態に戻す
      $('#add-movie-modal').modal('hide');
      resetAddBookModal();
    })
    .catch((error) => {
      // 失敗したとき
      console.error('エラー', error);
      resetAddBookModal();
      $('#add-movie__help')
        .text('保存できませんでした。')
        .fadeIn();
    });
   
});

// 全ての星マークを取得
const $ratings = $('#add-movie-modal').find('.rating');
// 全ての星マークにイベントハンドラを登録
$ratings.on('click', (e) => {
  // 一旦全ての星マークからクラスを取り除く
  $ratings
    .removeClass('active')
    .removeClass('highlight');
  // クリックされた星マークを取得する
  const $target = $(e.target);
  // クリックされた星マークにactiveクラスを付ける
  $target.addClass('active');
  // クリックされたよりも以前の星マークにhighlightクラスを付ける
  $ratings.slice(0, +$target.attr('data-rating')).addClass('highlight');
});