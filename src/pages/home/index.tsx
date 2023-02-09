import { useState, useEffect } from 'react';
import { Select, Space, Button, Input, Row, Col, message } from 'antd';
import type { SelectProps } from 'antd';
import { RedoOutlined, BlockOutlined, SwapOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api';
import ConfigModal, { ConfigType } from './components/ConfigModal';
import './index.less';

const cmds = {
  // 主设备 root
  root: {
    getNetName: '68 00 05 02 66 9B 68',
    setNetNameSuc: '68 00 06 82 00 7B 95 68',
    getMac: '68 00 05 04 50 FE 68',
    setMacSuc: '68 00 06 84 00 AB C1 68',
    getPanId: '68 00 05 10 F5 A8 68',
    setPanIdSuc: '68 00 06 90 00 5A 33 68',
  },
  // 从设备 node
  node: {
    getNetName: '68 00 05 03 EF 8A 68',
    setNetNameSuc: '68 00 06 83 00 A3 8C 68',
    getMac: '68 00 05 05 D9 EF 68',
    setMacSuc: '68 00 06 85 00 73 D8 68',
  },
};

type DeviceType = 'root' | 'node';

const Home = () => {
  const [type, setType] = useState<DeviceType>('root');
  const [path, setPath] = useState<string>();
  const [ports, setPorts] = useState<SelectProps['options']>([]);
  const [config, setConfig] = useState<ConfigType>({
    baudRate: 9600,
    dataBits: 8,
    parity: 'None',
    stopBits: 1,
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [downText, setDownText] = useState<string>();
  const [messageApi, contextHolder] = message.useMessage();

  const actions = [
    {
      name: '读取网络名称',
      type: 'get',
      label: '网络名称',
      key: 'getNetName',
      cmd: cmds[type].getNetName,
    },
    {
      name: '写入网络名称',
      type: 'set',
      label: '写入网络名称',
      key: 'setNetName',
    },
    {
      name: '读取Mac地址',
      type: 'get',
      label: 'Mac地址',
      key: 'getMac',
      cmd: cmds[type].getMac,
    },
    {
      name: '写入Mac地址',
      type: 'set',
      key: 'setMac',
      label: '写入Mac地址',
    },

    {
      name: '读取 PANid',
      type: 'get',
      label: 'PANid',
      key: 'getPanId',
      hide: type === 'node',
    },
    {
      name: '写入 PANid',
      type: 'set',
      key: 'setPANid',
      label: '写入 PANid',
      hide: type === 'node',
    },
  ];

  const getPorts = () => {
    invoke<string[]>('get_ports').then((response) => {
      const list = (response || []).map((item) => ({ label: item, value: item }));
      setPorts(list);
      messageApi.success('串口刷新成功');
    });
  };

  useEffect(() => getPorts(), []);

  useEffect(
    () => () => {
      handleClose();
    },
    []
  );

  const handleOpen = () => {
    if (!path) return messageApi.error('请选择串口');
    // Arguments should be passed as a JSON object with camelCase keys
    invoke<boolean>('open_port', { path, ...config }).then((open) => {
      setIsOpen(open);
      if (open) {
        messageApi.success('串口已打开');
      } else {
        messageApi.error('串口打开失败');
      }
    });
  };

  const handleClose = async () => {
    await invoke<void>('close_port');
    setIsOpen(false);
  };

  const handleWrite = async () => {
    await invoke<void>('write_port', { value: downText });
    await invoke<void>('read_port');
  };

  return (
    <div className="container">
      {contextHolder}
      <div className="header">
        <div className="header-title">利尔达串口调试助手</div>
        <div>
          <Space>
            <Select
              value={type}
              options={[
                { value: 'root', label: '主设备' },
                { value: 'node', label: '从设备' },
              ]}
              onChange={(value: DeviceType) => {
                setType(value);
              }}
            />
            <Select
              style={{ width: 240 }}
              value={path}
              options={ports}
              placeholder="请选择串口"
              onChange={(value: string) => {
                setPath(value);
              }}
            />
          </Space>
          <Space style={{ marginLeft: 24 }}>
            <Button onClick={getPorts} icon={<RedoOutlined />}>
              刷新串口
            </Button>
            {!isOpen && (
              <ConfigModal
                config={config}
                onSubmit={(values: ConfigType) => {
                  setConfig(values);
                  messageApi.success('串口配置更新成功');
                }}
              >
                <Button icon={<BlockOutlined />}>串口配置</Button>
              </ConfigModal>
            )}
            {isOpen ? (
              <Button icon={<CloseCircleOutlined />} onClick={handleClose}>
                关闭串口
              </Button>
            ) : (
              <Button icon={<SwapOutlined />} onClick={handleOpen}>
                打开串口
              </Button>
            )}
          </Space>
        </div>
      </div>
      <div className="main">
        <div className="bg">
          <Row gutter={24}>
            <Col span={10}>
              <div className="net">
                <div className="title">网络管理</div>
                <div className="net-wrap">
                  {actions.map((item) => {
                    return (
                      <Button type="primary" key={item.key}>
                        {item.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Col>
            <Col span={14}>
              <div className="uplink">
                <div className="title">接收区</div>
                <div className="uplink-wrap"></div>
              </div>
            </Col>
          </Row>
          <div className="downlink">
            <div className="title">发送区1</div>
            <div className="downlink-wrap">
              <Input.TextArea
                className="downlink-textArea"
                value={downText}
                onChange={(e) => {
                  setDownText(e.target.value);
                }}
              />
              <Button type="primary" className="downlink-btn" onClick={handleWrite}>
                发送
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
