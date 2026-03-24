declare module 'react-native-sms-retriever' {
  const SmsRetriever: {
    requestPhoneNumber: () => Promise<string>;
    startSmsRetriever: () => Promise<boolean>;
  };
  export default SmsRetriever;
}