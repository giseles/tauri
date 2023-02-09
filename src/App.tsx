import { ConfigProvider } from 'antd';
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/home';
import 'antd/dist/reset.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
        <Home />
      </StyleProvider>
    </ConfigProvider>
  );
}

export default App;
