import React, { useState, useMemo } from 'react';
import { Modal, Form, Select } from 'antd';

export type ConfigType = {
  baudRate: 1200 | 2400 | 4800 | 9600 | 115200;
  dataBits: 5 | 6 | 7 | 8;
  parity: 'None' | 'Odd' | 'Even';
  stopBits: 1 | 2;
};

export type ConfigModalProps = {
  children: JSX.Element;
  config: ConfigType;
  onSubmit: (values: ConfigType) => void;
};

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 17 },
};

const ConfigModal: React.FC<ConfigModalProps> = ({ children, config, onSubmit }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [form] = Form.useForm();

  const triggerDom = useMemo(() => {
    if (!children) {
      return null;
    }

    return React.cloneElement(children, {
      key: 'trigger',
      ...children.props,
      onClick: async (e: any) => {
        setOpen(!open);
        children.props?.onClick?.(e);
      },
    });
  }, [setOpen, children, open]);

  const onOk = () => {
    form.validateFields().then((values) => {
      onSubmit?.(values);
      setOpen(false);
    });
  };

  return (
    <>
      {triggerDom}
      <Modal
        title="串口配置"
        open={open}
        onOk={onOk}
        onCancel={() => {
          setOpen(false);
        }}
      >
        <Form form={form} name="userForm" {...layout} initialValues={config}>
          <Form.Item name="baudRate" label="波特率" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 1200, value: 1200 },
                { label: 2400, value: 2400 },
                { label: 4800, value: 4800 },
                { label: 9600, value: 9600 },
                { label: 115200, value: 115200 },
              ]}
            />
          </Form.Item>
          <Form.Item name="dataBits" label="数据位" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 5, value: 5 },
                { label: 6, value: 6 },
                { label: 7, value: 7 },
                { label: 8, value: 8 },
              ]}
            />
          </Form.Item>
          <Form.Item name="parity" label="校验位" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 'None', value: 'None' },
                { label: 'Odd', value: 'Odd' },
                { label: 'Even', value: 'Even' },
              ]}
            />
          </Form.Item>
          <Form.Item name="stopBits" label="停止位" rules={[{ required: true }]}>
            <Select
              options={[
                { label: 1, value: 1 },
                { label: 2, value: 2 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ConfigModal;
