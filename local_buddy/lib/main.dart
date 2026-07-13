
import 'package:flutter/material.dart';

void main() {
  runApp(const LocalBuddyApp());
}

class LocalBuddyApp extends StatelessWidget {
  const LocalBuddyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Local Buddy',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Local Buddy'),
      ),
      body: const Center(
        child: Text('Hello, Local Buddy!'),
      ),
    );
  }
}
