Attribute VB_Name = "ClassVowelMacro"
Option Explicit

Private Const TONE_MACRON As Long = 1
Private Const TONE_ACUTE As Long = 2
Private Const TONE_PLAIN As Long = 3
Private Const TONE_GRAVE As Long = 4

Public Sub FillColumnBFromF()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim r As Long
    Dim src As String
    Dim clsTxt As String
    Dim outText As String

    Set ws = ActiveSheet

    lastRow = Application.Max( _
        ws.Cells(ws.Rows.Count, "B").End(xlUp).Row, _
        ws.Cells(ws.Rows.Count, "F").End(xlUp).Row, _
        ws.Cells(ws.Rows.Count, "L").End(xlUp).Row)

    Application.ScreenUpdating = False

    For r = 2 To lastRow
        If Not ws.Cells(r, "B").HasFormula Then
            If LenB(Trim$(CStr(ws.Cells(r, "B").Value))) = 0 Then
                src = CStr(ws.Cells(r, "F").Value)
                clsTxt = Trim$(CStr(ws.Cells(r, "L").Value))

                If LenB(src) > 0 And clsTxt Like "[1-4]" Then
                    outText = ConvertPattern(src, CLng(clsTxt))
                    If LenB(outText) > 0 Then
                        ws.Cells(r, "B").Value = outText
                    End If
                End If
            End If
        End If
    Next r

    Application.ScreenUpdating = True
End Sub

Private Function ConvertPattern(ByVal src As String, ByVal classNo As Long) As String
    Dim s As String
    Dim result As String
    Dim i As Long
    Dim ch As String
    Dim tone As Long
    Dim tokenLen As Long
    Dim nextPos As Long
    Dim nextCh As String

    s = RemoveHyphens(src)
    result = ""
    i = 1

    Do While i <= Len(s)
        ch = Mid$(s, i, 1)

        ' class 4: iV -> ī (tone mark on V is ignored)
        If classNo = 4 Then
            If LCase$(ch) = "i" Then
                If IsVToken(s, i + 1, tone, tokenLen) Then
                    result = result & ChrW(299) ' ī
                    i = i + 1 + tokenLen
                    GoTo ContinueLoop
                End If
            End If
        End If

        If IsVToken(s, i, tone, tokenLen) Then
            nextPos = i + tokenLen
            nextCh = ""
            If nextPos <= Len(s) Then nextCh = Mid$(s, nextPos, 1)

            ' class 4: Vi -> ī (tone mark on V is ignored)
            If classNo = 4 And LCase$(nextCh) = "i" Then
                result = result & ChrW(299) ' ī
                i = nextPos + 1
                GoTo ContinueLoop
            End If

            result = result & VowelByClass(classNo, tone)
            i = i + tokenLen
            GoTo ContinueLoop
        End If

        result = result & ch
        i = i + 1

ContinueLoop:
    Loop

    ConvertPattern = result
End Function

Private Function RemoveHyphens(ByVal s As String) As String
    Dim t As String
    t = s
    t = Replace(t, "-", "")
    t = Replace(t, ChrW(&H2010), "") ' ‐
    t = Replace(t, ChrW(&H2011), "") ' ‑
    t = Replace(t, ChrW(&H2012), "") ' ‒
    t = Replace(t, ChrW(&H2013), "") ' –
    t = Replace(t, ChrW(&H2014), "") ' —
    t = Replace(t, ChrW(&H2212), "") ' −
    RemoveHyphens = t
End Function

Private Function IsVToken(ByVal s As String, ByVal pos As Long, ByRef tone As Long, ByRef tokenLen As Long) As Boolean
    Dim baseCh As String
    Dim mark As String

    IsVToken = False
    tone = TONE_PLAIN
    tokenLen = 0

    If pos < 1 Or pos > Len(s) Then Exit Function

    baseCh = Mid$(s, pos, 1)
    If UCase$(baseCh) <> "V" Then Exit Function

    tokenLen = 1

    If pos < Len(s) Then
        mark = Mid$(s, pos + 1, 1)
        Select Case AscW(mark)
            Case &H304 ' combining macron
                tone = TONE_MACRON
                tokenLen = 2
            Case &H301 ' combining acute
                tone = TONE_ACUTE
                tokenLen = 2
            Case &H300 ' combining grave
                tone = TONE_GRAVE
                tokenLen = 2
            Case &H308 ' combining diaeresis -> treat as plain tone
                tone = TONE_PLAIN
                tokenLen = 2
            Case Else
                tone = TONE_PLAIN
        End Select
    End If

    IsVToken = True
End Function

Private Function VowelByClass(ByVal classNo As Long, ByVal tone As Long) As String
    Select Case classNo
        Case 1
            Select Case tone
                Case TONE_MACRON: VowelByClass = ChrW(257) ' ā
                Case TONE_ACUTE:  VowelByClass = ChrW(225) ' á
                Case TONE_GRAVE:  VowelByClass = ChrW(224) ' à
                Case Else:        VowelByClass = "a"
            End Select

        Case 2
            Select Case tone
                Case TONE_MACRON: VowelByClass = ChrW(275) ' ē
                Case TONE_ACUTE:  VowelByClass = ChrW(233) ' é
                Case TONE_GRAVE:  VowelByClass = ChrW(232) ' è
                Case Else:        VowelByClass = "e"
            End Select

        Case 3
            Select Case tone
                Case TONE_MACRON: VowelByClass = ChrW(333) ' ō
                Case TONE_ACUTE:  VowelByClass = ChrW(243) ' ó
                Case TONE_GRAVE:  VowelByClass = ChrW(242) ' ò
                Case Else:        VowelByClass = "o"
            End Select

        Case 4
            Select Case tone
                Case TONE_MACRON: VowelByClass = ChrW(299) ' ī
                Case TONE_ACUTE:  VowelByClass = ChrW(237) ' í
                Case TONE_GRAVE:  VowelByClass = ChrW(236) ' ì
                Case Else:        VowelByClass = ChrW(239) ' ï
            End Select
    End Select
End Function
