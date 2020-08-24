import React, {
  FC,
  useState,
  useRef,
  useEffect,
  Ref,
  KeyboardEventHandler,
} from "react";
// import Editor from "draft-js-plugins-editor";

import {
  Editor,
  EditorState,
  ContentBlock,
  convertToRaw,
  RichUtils,
  DraftHandleValue,
  getDefaultKeyBinding,
  KeyBindingUtil,
  DraftStyleMap,
  CompositeDecorator,
} from "draft-js";
import "draft-js/dist/Draft.css";

import draftToMarkdown from "draftjs-to-markdown";
import "./index.css";

const { hasCommandModifier } = KeyBindingUtil;

// 新建Link组件渲染超链接
const Link = (props) => {
  // 这里通过contentState来获取entity，之后通过getData获取entity中包含的数据
  // const {url} = props.contentState.getEntity(props.entityKey).getData();
  return <a href={props.url}>{props.children}</a>;
};

// 新建装饰器自定义处理文本
const HandleSpan = (props) => {
  return (
    <span style={{ color: "green" }} data-offset-key={props.offsetKey}>
      {props.children}
    </span>
  );
};
const HashtagSpan = (props) => {
  return (
    <span style={{ color: "blue" }} data-offset-key={props.offsetKey}>
      {" "}
      {props.children}{" "}
    </span>
  );
};
const compositeDecorator = new CompositeDecorator([
  {
    strategy: function (contentBlock, callback, contentState) {
      // 这里可以根据contentBlock和contentState做一些判断，根据判断给出要使用对应组件渲染的位置执行callback
      // callback函数接收2个参数，start组件包裹的起始位置，end组件的结束位置
      // callback(start, end);
      console.log(contentBlock.getType());
      if (contentBlock.getType() === "header-one") callback(1, 2);
    },
    component: HandleSpan,
  },
  {
    strategy: function (contentBlock, callback, contentState) {
      callback(3, 4);
    },
    component: HashtagSpan,
  },
  {
    // 处理超链接的策略
    strategy: function (contentBlock, callback, contentState) {
      // 这个方法接收2个函数作为参数，如果第一个参数的函数执行时返回true，就会执行第二个参数函数，同时会将匹配的字符的起始位置和结束位置传递给第二个参数。
      contentBlock.findEntityRanges(
        (character) => {
          const entityKey = character.getEntity();
          return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === "LINK"
          );
        },
        function (...args) {
          callback(args[0], args[1]);
        }
      );
    },
    component: Link,
  },
]);

const DraftEditor: FC = (props) => {
  const [editorState, setEditorState] = useState(
    EditorState.createEmpty(compositeDecorator)
  );
  const inputRef = useRef(); // 输入框ref定义

  /** 这里是对生命周期的处理 */
  useEffect(() => {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      // 处理聚焦
      if (e.ctrlKey && e.keyCode === 229 /* Ctrl + 'W' */) {
        (inputRef.current as any).focus();
      }
    });
    return () => {};
  }, []);

  const onChange = (state: React.SetStateAction<EditorState>) => {
    setEditorState(state);
  };

  // 通过改变类名来自定义样式
  function myBlockStyleFn(contentBlock: ContentBlock): string {
    const type = contentBlock.getType();
    // console.log(contentBlock, 'type', type) // 该行为会在每次输入文字时候触发，未设置的值默认为unstyled
    if (type === "blockquote") {
      // return "superFancyBlockquote";
      return "RichEditor-blockquote";
    }
    return type;
  }

  // 粘贴文本处理
  const handlePastedText = (
    text: string,
    html: string | undefined,
    editorState: EditorState
  ): any => {
    console.log({ text, html, editorState });
    // setEditorState(removeEditorStyles(editorState))
    setEditorState(editorState);
  };

  // Markdown处理和配置
  const hashConfig = {
    trigger: "#",
    separator: " ",
  };
  const config = {
    blockTypesMapping: {
      "unordered-list-item": "* ",
      "header-two": "## ",
    },
    emptyLineBeforeBlock: true,
  };
  const rawContentState = convertToRaw(editorState.getCurrentContent());
  const markup = draftToMarkdown(
    rawContentState,
    hashConfig,
    // customEntityTransform,
    config
  );
  // console.log({markup}) // 将原始字符转化后的文本

  // 处理快捷键
  const handleKeyCommand = (
    command: string,
    editorState: EditorState,
    eventTimeStamp: number
  ): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command); // 执行快捷键所选操作返回新的state

    switch (command) {
      case "myeditor-save":
        console.log("我要保存了别拦着我", editorState, command);
        return "handled";
      case "myeditor-space":
        console.log("我按空格了，你看着办吧", editorState, command); // 此处暂时无法到达
        return "handled";
      case "myeditor-h1":
        toggleBlockType("header-one");
        return "handled";
      case "myeditor-h2":
        toggleBlockType("header-two");
        return "handled";
      case "myeditor-h3":
        toggleBlockType("header-three");
        return "handled";
      case "myeditor-h4":
        toggleBlockType("header-four");
        return "handled";
      case "myeditor-h5":
        toggleBlockType("header-five");
        return "handled";
      case "myeditor-h6":
        toggleBlockType("header-six");
        return "handled";
      case "myeditor-unorder-list":
        toggleBlockType("unordered-list-item");
        return "handled";
      case "myeditor-ordered-list":
        toggleBlockType("ordered-list-item");
        return "handled";
      case "myeditor-focus":
        (inputRef.current as any).focus();
        return "handled";
      default:
        break;
    }

    if (newState) {
      onChange(newState);
      return "handled";
    }

    return "not-handled";
  };

  // 自定义键盘快捷键 e: SyntheticKeyboardEvent
  const myKeyBindingFn = (e: React.KeyboardEvent<{}>): string | null => {
    console.log(e.keyCode, "keyCode");
    if (!hasCommandModifier(e)) return getDefaultKeyBinding(e);
    switch (e.keyCode) {
      case 83 /* 'S' */:
        console.log("保存来了");
        return "myeditor-save";
      case 49:
        return "myeditor-h1";
      case 50:
        return "myeditor-h2";
      case 51:
        return "myeditor-h3";
      case 52:
        return "myeditor-h4";
      case 53:
        return "myeditor-h5";
      case 54:
        return "myeditor-h6";
      case 55:
        return "myeditor-unorder-list";
      case 56:
        return "myeditor-ordered-list";
      case 229:
        return "myeditor-focus";
      default:
        return getDefaultKeyBinding(e);
    }

    // // if (e.keyCode === 49 /* `1` key */ && hasCommandModifier(e)) {

    // // }
    // return getDefaultKeyBinding(e);
  };

  useEffect(() => {
    if (inputRef.current !== undefined) {
      console.log("有焦点了", inputRef, inputRef.current);
      (inputRef.current as any).focus();
    }
  }, [inputRef]);

  // 处理tab事件
  // const onTab = (event) => {
  //   if (keyCommandHandlers("tab", this.state.editorState, this) === "handled") {
  //     event.preventDefault();
  //   }
  //   if (this.editorProps.onTab) {
  //     this.editorProps.onTab(event);
  //   }
  // };

  // 处理行内样式
  const toggleInlineStyle = (inlineStyle) => {
    onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    // (inputRef.current as any).focus()
  };

  // 自定义行内样式
  const editorStyleMap: DraftStyleMap = {
    //字体
    Bold: {
      fontWeight: "bold",
    },
    Italic: {
      fontStyle: "italic",
    },
    RED: {
      color: "red",
    },
  };

  // 处理块级样式
  const toggleBlockType = (blockType: string) => {
    onChange(RichUtils.toggleBlockType(editorState, blockType));
  };

  // 实现自定义组件
  const ImgComponent = (props) => {
    return (
      <img
        style={{ height: "300px", width: "auto" }}
        src={props.blockProps.src}
        alt='图片'
      />
    );
  };

  function myBlockRenderer(contentBlock: ContentBlock) {
    // 获取到contentBlock的文本信息，可以用contentBlock提供的其它方法获取到想要使用的信息
    const text = contentBlock.getText();
    // 我们假定这里图片的文本格式为![图片名称](htt://....)
    let matches = text.match(/\!\[(.*)\]\((http.*)\)/);
    if (matches) {
      return {
        component: ImgComponent, // 指定组件
        editable: false, // 这里设置自定义的组件可不可以编辑，因为是图片，这里选择不可编辑
        // 这里的props在自定义的组件中需要用this.props.blockProps来访问
        props: {
          src: matches[2], // https://dss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=2915512436,1541993188&fm=26&gp=0.jpg
        },
      };
    }
  }

  // 创建实体实现超链接等功能
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity("LINK", "MUTABLE", {
    url: "http://www.zombo.com",
  });
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

  return (
    <div>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleInlineStyle("BOLD");
        }}
        onFocus={(e) => {
          e.preventDefault();
        }}
      >
        Bold
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleInlineStyle("ITALIC");
        }}
      >
        Italic
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleInlineStyle("RED");
        }}
        onFocus={(e) => {
          e.preventDefault();
        }}
      >
        RED
      </button>
      <hr />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlockType("header-one");
        }}
      >
        H1
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlockType("blockquote");
        }}
      >
        blockquote
      </button>
      <hr />
      <div style={{ minHeight: 300 }} onClick={() => (inputRef.current as any).focus()}>
        <Editor
          editorState={editorState}
          customStyleMap={editorStyleMap}
          blockRendererFn={myBlockRenderer}
          onChange={onChange}
          blockStyleFn={myBlockStyleFn}
          handleKeyCommand={handleKeyCommand}
          handlePastedText={handlePastedText}
          placeholder='Enter something'
          keyBindingFn={myKeyBindingFn} // 自定义快捷键映射
          ref={inputRef}
        ></Editor>
      </div>
    </div>
  );
};

export default DraftEditor;
