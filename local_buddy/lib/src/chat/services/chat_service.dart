
class ChatService {
  Future<void> sendMessage(String message) async {
    // Implement message sending logic
  }

  Stream<List<String>> getMessages() {
    // Implement message retrieval logic
    return Stream.fromIterable([['Hello', 'Hi']]);
  }
}
